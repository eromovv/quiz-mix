import { get, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOM_VERSION = 1;
const ROOM_ID_BYTES = 9;
const OWNER_TOKEN_BYTES = 24;
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{8,32}$/;
const LOCAL_ROOM_DIR = resolve(process.cwd(), ".vercel", "room-cache");

function makeToken(byteLength) {
  return randomBytes(byteLength).toString("base64url");
}

function getRoomPath(roomId) {
  return `quiz-mix/rooms/${roomId}.json`;
}

function shouldUseLocalRoomStore() {
  return process.env.VERCEL !== "1" && !process.env.BLOB_READ_WRITE_TOKEN;
}

function getLocalRoomFile(roomId) {
  return resolve(LOCAL_ROOM_DIR, `${roomId}.json`);
}

async function readRoomPayload(roomId) {
  if (shouldUseLocalRoomStore()) {
    return JSON.parse(await readFile(getLocalRoomFile(roomId), "utf-8"));
  }

  const result = await get(getRoomPath(roomId), { access: "private", useCache: false });
  if (!result || !result.stream || result.statusCode === 404) {
    throw Object.assign(new Error("Room not found."), { statusCode: 404 });
  }

  return JSON.parse(await streamToText(result.stream));
}

async function writeRoomPayload(room) {
  const payload = JSON.stringify(room);
  if (shouldUseLocalRoomStore()) {
    const filePath = getLocalRoomFile(room.id);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, payload, "utf-8");
    return;
  }

  await put(getRoomPath(room.id), payload, {
    access: "private",
    contentType: "application/json; charset=utf-8",
    allowOverwrite: true,
  });
}

function normalizeCardsStore(cards) {
  const source = cards && typeof cards === "object" ? cards : {};
  const overrides = source.overrides && typeof source.overrides === "object" ? source.overrides : {};

  return {
    music: Array.isArray(source.music) ? source.music : [],
    movies: Array.isArray(source.movies) ? source.movies : [],
    facts: Array.isArray(source.facts) ? source.facts : [],
    overrides: {
      music: overrides.music && typeof overrides.music === "object" ? overrides.music : {},
      movies: overrides.movies && typeof overrides.movies === "object" ? overrides.movies : {},
      facts: overrides.facts && typeof overrides.facts === "object" ? overrides.facts : {},
    },
  };
}

function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== "string" || !ROOM_ID_PATTERN.test(roomId)) {
    throw Object.assign(new Error("Invalid room id."), { statusCode: 400 });
  }
}

async function streamToText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

function publicRoom(room) {
  return {
    v: room.v,
    id: room.id,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    cards: normalizeCardsStore(room.cards),
  };
}

export async function readRoom(roomId) {
  validateRoomId(roomId);
  const room = await readRoomPayload(roomId);
  if (!room || room.v !== ROOM_VERSION || room.id !== roomId || typeof room.ownerToken !== "string") {
    throw Object.assign(new Error("Room data is invalid."), { statusCode: 500 });
  }

  return room;
}

export async function createRoom(cards) {
  const id = makeToken(ROOM_ID_BYTES);
  const ownerToken = makeToken(OWNER_TOKEN_BYTES);
  const now = new Date().toISOString();
  const room = {
    v: ROOM_VERSION,
    id,
    ownerToken,
    createdAt: now,
    updatedAt: now,
    cards: normalizeCardsStore(cards),
  };

  await writeRoomPayload(room);

  return { room: publicRoom(room), ownerToken };
}

export async function getPublicRoom(roomId) {
  return publicRoom(await readRoom(roomId));
}

export async function updateRoom(roomId, ownerToken, cards) {
  validateRoomId(roomId);
  if (!ownerToken || typeof ownerToken !== "string") {
    throw Object.assign(new Error("Owner token is required."), { statusCode: 401 });
  }

  const existing = await readRoom(roomId);
  if (existing.ownerToken !== ownerToken) {
    throw Object.assign(new Error("Owner token is invalid."), { statusCode: 403 });
  }

  const room = {
    ...existing,
    updatedAt: new Date().toISOString(),
    cards: normalizeCardsStore(cards),
  };

  await writeRoomPayload(room);

  return publicRoom(room);
}

export async function handleRoomsRequest(method, query, body) {
  if (method === "GET") {
    const id = query.id || query.roomId;
    return { statusCode: 200, body: { room: await getPublicRoom(Array.isArray(id) ? id[0] : id) } };
  }

  if (method === "POST") {
    const result = await createRoom(body?.cards);
    return { statusCode: 201, body: result };
  }

  if (method === "PUT") {
    const room = await updateRoom(body?.id, body?.ownerToken, body?.cards);
    return { statusCode: 200, body: { room } };
  }

  return {
    statusCode: 405,
    headers: { Allow: "GET, POST, PUT" },
    body: { error: "Method not allowed" },
  };
}

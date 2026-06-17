import { get, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  ACCESS_TOKEN_BYTES,
  assertNotExpired,
  getAccessTokenTtlMs,
  getOwnerTokenTtlMs,
  isExpired,
  makeExpiryDate,
} from "./room-auth.js";

const ROOM_VERSION = 2;
const LEGACY_ROOM_VERSION = 1;
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

const ROOM_CATEGORY_KEYS = new Set(["music", "movies", "facts"]);

function inferLegacyCategories(source) {
  return ["music", "movies", "facts"].filter((key) => {
    if (Array.isArray(source[key]) && source[key].length > 0) {
      return true;
    }
    const overrides = source.overrides?.[key];
    return overrides && typeof overrides === "object" && Object.keys(overrides).length > 0;
  });
}

function normalizeCardsStore(cards) {
  const source = cards && typeof cards === "object" ? cards : {};
  const overrides = source.overrides && typeof source.overrides === "object" ? source.overrides : {};
  const categories = Array.isArray(source.categories)
    ? source.categories.filter((key) => ROOM_CATEGORY_KEYS.has(key))
    : inferLegacyCategories(source);

  return {
    categories,
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
    accessTokenExpiresAt: room.accessTokenExpiresAt,
    ownerTokenExpiresAt: room.ownerTokenExpiresAt,
    cards: normalizeCardsStore(room.cards),
  };
}

function normalizeToken(token) {
  if (Array.isArray(token)) {
    return token[0] || "";
  }
  return typeof token === "string" ? token : "";
}

function resolveTokenRole(room, token) {
  if (!token) {
    return null;
  }
  if (token === room.ownerToken) {
    return "owner";
  }
  if (token === room.accessToken) {
    return "access";
  }
  return null;
}

function assertReadAccess(room, token) {
  const role = resolveTokenRole(room, token);
  if (!role) {
    throw Object.assign(new Error("Access token is invalid."), { statusCode: 403, code: "TOKEN_INVALID" });
  }

  if (role === "owner") {
    assertNotExpired(room.ownerTokenExpiresAt, "Owner token has expired.", 401);
    return "owner";
  }

  assertNotExpired(room.accessTokenExpiresAt, "Access link has expired.", 401);
  return "access";
}

function assertOwnerAccess(room, ownerToken) {
  if (!ownerToken || typeof ownerToken !== "string") {
    throw Object.assign(new Error("Owner token is required."), { statusCode: 401 });
  }
  if (ownerToken !== room.ownerToken) {
    throw Object.assign(new Error("Owner token is invalid."), { statusCode: 403, code: "TOKEN_INVALID" });
  }
  assertNotExpired(room.ownerTokenExpiresAt, "Owner token has expired.", 401);
}

async function migrateRoomIfNeeded(room, roomId) {
  if (room.v === ROOM_VERSION) {
    return room;
  }

  if (room.v !== LEGACY_ROOM_VERSION || room.id !== roomId || typeof room.ownerToken !== "string") {
    throw Object.assign(new Error("Room data is invalid."), { statusCode: 500 });
  }

  const migrated = {
    ...room,
    v: ROOM_VERSION,
    accessToken: makeToken(ACCESS_TOKEN_BYTES),
    accessTokenExpiresAt: makeExpiryDate(getAccessTokenTtlMs()),
    ownerTokenExpiresAt: makeExpiryDate(getOwnerTokenTtlMs()),
    updatedAt: new Date().toISOString(),
  };

  await writeRoomPayload(migrated);
  return migrated;
}

export async function readRoom(roomId) {
  validateRoomId(roomId);
  const raw = await readRoomPayload(roomId);
  if (!raw || raw.id !== roomId) {
    throw Object.assign(new Error("Room not found."), { statusCode: 404 });
  }

  return migrateRoomIfNeeded(raw, roomId);
}

export async function createRoom(cards) {
  const id = makeToken(ROOM_ID_BYTES);
  const ownerToken = makeToken(OWNER_TOKEN_BYTES);
  const accessToken = makeToken(ACCESS_TOKEN_BYTES);
  const now = new Date().toISOString();
  const room = {
    v: ROOM_VERSION,
    id,
    ownerToken,
    accessToken,
    accessTokenExpiresAt: makeExpiryDate(getAccessTokenTtlMs()),
    ownerTokenExpiresAt: makeExpiryDate(getOwnerTokenTtlMs()),
    createdAt: now,
    updatedAt: now,
    cards: normalizeCardsStore(cards),
  };

  await writeRoomPayload(room);

  return {
    room: publicRoom(room),
    ownerToken,
    accessToken,
    accessTokenExpiresAt: room.accessTokenExpiresAt,
    ownerTokenExpiresAt: room.ownerTokenExpiresAt,
  };
}

export async function getAuthorizedRoom(roomId, token) {
  const room = await readRoom(roomId);
  const role = assertReadAccess(room, normalizeToken(token));
  const payload = { room: publicRoom(room), role };

  if (role === "owner") {
    payload.accessToken = room.accessToken;
  }

  return payload;
}

export async function updateRoom(roomId, ownerToken, cards) {
  validateRoomId(roomId);
  const existing = await readRoom(roomId);
  assertOwnerAccess(existing, ownerToken);

  const room = {
    ...existing,
    updatedAt: new Date().toISOString(),
    cards: normalizeCardsStore(cards),
  };

  await writeRoomPayload(room);

  return {
    room: publicRoom(room),
    accessToken: room.accessToken,
    accessTokenExpiresAt: room.accessTokenExpiresAt,
    ownerTokenExpiresAt: room.ownerTokenExpiresAt,
  };
}

export async function renewRoomAccessToken(roomId, ownerToken) {
  validateRoomId(roomId);
  const existing = await readRoom(roomId);
  assertOwnerAccess(existing, ownerToken);

  const room = {
    ...existing,
    accessToken: makeToken(ACCESS_TOKEN_BYTES),
    accessTokenExpiresAt: makeExpiryDate(getAccessTokenTtlMs()),
    ownerTokenExpiresAt: makeExpiryDate(getOwnerTokenTtlMs()),
    updatedAt: new Date().toISOString(),
  };

  await writeRoomPayload(room);

  return {
    room: publicRoom(room),
    accessToken: room.accessToken,
    accessTokenExpiresAt: room.accessTokenExpiresAt,
    ownerTokenExpiresAt: room.ownerTokenExpiresAt,
  };
}

export async function handleRoomsRequest(method, query, body) {
  if (method === "GET") {
    const id = query.id || query.roomId;
    const token = query.token || query.t;
    return {
      statusCode: 200,
      body: await getAuthorizedRoom(Array.isArray(id) ? id[0] : id, token),
    };
  }

  if (method === "POST") {
    const result = await createRoom(body?.cards);
    return { statusCode: 201, body: result };
  }

  if (method === "PUT") {
    const result = await updateRoom(body?.id, body?.ownerToken, body?.cards);
    return { statusCode: 200, body: result };
  }

  if (method === "PATCH") {
    const result = await renewRoomAccessToken(body?.id, body?.ownerToken);
    return { statusCode: 200, body: result };
  }

  return {
    statusCode: 405,
    headers: { Allow: "GET, POST, PUT, PATCH" },
    body: { error: "Method not allowed" },
  };
}

export { isExpired };

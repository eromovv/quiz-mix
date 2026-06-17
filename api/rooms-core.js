import { get, put, del } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { addUserRoom, listUserRoomIds, removeUserRoom } from "./auth-store.js";
import {
  ACCESS_TOKEN_BYTES,
  assertNotExpired,
  getAccessTokenTtlMs,
  getOwnerTokenTtlMs,
  isExpired,
  makeExpiryDate,
} from "./room-auth.js";
import { getUserIdFromRequest } from "./session-cookie.js";

const ROOM_VERSION = 3;
const LEGACY_ROOM_VERSION = 1;
const INTERMEDIATE_ROOM_VERSION = 2;
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

async function deleteRoomPayload(roomId) {
  if (shouldUseLocalRoomStore()) {
    try {
      await unlink(getLocalRoomFile(roomId));
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
    return;
  }

  await del(getRoomPath(roomId));
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
    ownerUserId: room.ownerUserId || null,
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

function isAccountOwner(room, userId) {
  return Boolean(userId && room.ownerUserId && room.ownerUserId === userId);
}

function assertReadAccess(room, token, userId) {
  if (isAccountOwner(room, userId)) {
    return "owner";
  }

  const normalizedToken = normalizeToken(token);
  if (normalizedToken) {
    if (normalizedToken === room.ownerToken) {
      assertNotExpired(room.ownerTokenExpiresAt, "Owner token has expired.", 401);
      return "owner";
    }

    if (normalizedToken === room.accessToken) {
      assertNotExpired(room.accessTokenExpiresAt, "Access link has expired.", 401);
      return "access";
    }
  }

  // Guest invite links are public; room lifetime limits will be enforced here later.
  return "access";
}

function assertOwnerAccess(room, ownerToken, userId) {
  if (isAccountOwner(room, userId)) {
    return;
  }

  if (!ownerToken || typeof ownerToken !== "string") {
    throw Object.assign(new Error("Owner token is required."), { statusCode: 401 });
  }
  if (ownerToken !== room.ownerToken) {
    throw Object.assign(new Error("Owner token is invalid."), { statusCode: 403, code: "TOKEN_INVALID" });
  }
  assertNotExpired(room.ownerTokenExpiresAt, "Owner token has expired.", 401);
}

async function migrateRoomIfNeeded(room, roomId) {
  let current = room;

  if (current.v === LEGACY_ROOM_VERSION) {
    if (current.id !== roomId || typeof current.ownerToken !== "string") {
      throw Object.assign(new Error("Room data is invalid."), { statusCode: 500 });
    }

    current = {
      ...current,
      v: INTERMEDIATE_ROOM_VERSION,
      accessToken: makeToken(ACCESS_TOKEN_BYTES),
      accessTokenExpiresAt: makeExpiryDate(getAccessTokenTtlMs()),
      ownerTokenExpiresAt: makeExpiryDate(getOwnerTokenTtlMs()),
      updatedAt: new Date().toISOString(),
    };
  }

  if (current.v === INTERMEDIATE_ROOM_VERSION) {
    current = {
      ...current,
      v: ROOM_VERSION,
      ownerUserId: current.ownerUserId ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  if (current.v !== ROOM_VERSION) {
    throw Object.assign(new Error("Room data is invalid."), { statusCode: 500 });
  }

  if (current !== room) {
    await writeRoomPayload(current);
  }

  return current;
}

export async function readRoom(roomId) {
  validateRoomId(roomId);
  const raw = await readRoomPayload(roomId);
  if (!raw || raw.id !== roomId) {
    throw Object.assign(new Error("Room not found."), { statusCode: 404 });
  }

  return migrateRoomIfNeeded(raw, roomId);
}

export async function createRoom(cards, userId) {
  if (!userId || typeof userId !== "string") {
    throw Object.assign(new Error("Authentication required."), { statusCode: 401 });
  }

  const id = makeToken(ROOM_ID_BYTES);
  const ownerToken = makeToken(OWNER_TOKEN_BYTES);
  const accessToken = makeToken(ACCESS_TOKEN_BYTES);
  const now = new Date().toISOString();
  const room = {
    v: ROOM_VERSION,
    id,
    ownerUserId: userId,
    ownerToken,
    accessToken,
    accessTokenExpiresAt: makeExpiryDate(getAccessTokenTtlMs()),
    ownerTokenExpiresAt: makeExpiryDate(getOwnerTokenTtlMs()),
    createdAt: now,
    updatedAt: now,
    cards: normalizeCardsStore(cards),
  };

  await writeRoomPayload(room);
  await addUserRoom(userId, id);

  return {
    room: publicRoom(room),
    ownerToken,
    accessToken,
    accessTokenExpiresAt: room.accessTokenExpiresAt,
    ownerTokenExpiresAt: room.ownerTokenExpiresAt,
  };
}

export async function getAuthorizedRoom(roomId, token, userId) {
  const room = await readRoom(roomId);
  const role = assertReadAccess(room, token, userId);
  const payload = { room: publicRoom(room), role };

  if (role === "owner") {
    payload.accessToken = room.accessToken;
    payload.ownerToken = room.ownerToken;
  }

  return payload;
}

export async function updateRoom(roomId, ownerToken, cards, userId) {
  validateRoomId(roomId);
  const existing = await readRoom(roomId);
  assertOwnerAccess(existing, ownerToken, userId);

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

export async function renewRoomAccessToken(roomId, ownerToken, userId) {
  validateRoomId(roomId);
  const existing = await readRoom(roomId);
  assertOwnerAccess(existing, ownerToken, userId);

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
    ownerToken: room.ownerToken,
  };
}

export async function deleteRoom(roomId, ownerToken, userId) {
  validateRoomId(roomId);
  const existing = await readRoom(roomId);
  assertOwnerAccess(existing, ownerToken, userId);

  await deleteRoomPayload(roomId);
  if (userId) {
    await removeUserRoom(userId, roomId);
  }

  return { ok: true, id: roomId };
}

export async function claimRoomForUser(roomId, ownerToken, userId) {
  validateRoomId(roomId);
  if (!userId || typeof userId !== "string") {
    throw Object.assign(new Error("Authentication required."), { statusCode: 401 });
  }

  const existing = await readRoom(roomId);
  if (existing.ownerUserId && existing.ownerUserId !== userId) {
    throw Object.assign(new Error("This room already belongs to another account."), { statusCode: 403 });
  }

  assertOwnerAccess(existing, ownerToken, null);

  if (existing.ownerUserId === userId) {
    return {
      room: publicRoom(existing),
      ownerToken: existing.ownerToken,
      accessToken: existing.accessToken,
      accessTokenExpiresAt: existing.accessTokenExpiresAt,
      ownerTokenExpiresAt: existing.ownerTokenExpiresAt,
      alreadyClaimed: true,
    };
  }

  const room = {
    ...existing,
    ownerUserId: userId,
    updatedAt: new Date().toISOString(),
  };

  await writeRoomPayload(room);
  await addUserRoom(userId, roomId);

  return {
    room: publicRoom(room),
    ownerToken: room.ownerToken,
    accessToken: room.accessToken,
    accessTokenExpiresAt: room.accessTokenExpiresAt,
    ownerTokenExpiresAt: room.ownerTokenExpiresAt,
    alreadyClaimed: false,
  };
}

export async function listRoomsForUser(userId) {
  const roomIds = await listUserRoomIds(userId);
  const rooms = [];

  for (const roomId of roomIds) {
    try {
      const room = await readRoom(roomId);
      if (room.ownerUserId === userId) {
        rooms.push(publicRoom(room));
      }
    } catch {
      /* skip missing rooms */
    }
  }

  return rooms.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

export async function assertBlobUploadAccess(roomId, { ownerToken, userId }) {
  validateRoomId(roomId);
  const room = await readRoom(roomId);
  assertOwnerAccess(room, ownerToken, userId);
  return room;
}

export async function handleRoomsRequest(method, query, body, request) {
  const userId = request ? getUserIdFromRequest(request) : null;

  if (method === "GET") {
    const id = query.id || query.roomId;
    const token = query.token || query.t;
    return {
      statusCode: 200,
      body: await getAuthorizedRoom(Array.isArray(id) ? id[0] : id, token, userId),
    };
  }

  if (method === "POST") {
    const result = await createRoom(body?.cards, userId);
    return { statusCode: 201, body: result };
  }

  if (method === "PUT") {
    const result = await updateRoom(body?.id, body?.ownerToken, body?.cards, userId);
    return { statusCode: 200, body: result };
  }

  if (method === "PATCH") {
    const result = await renewRoomAccessToken(body?.id, body?.ownerToken, userId);
    return { statusCode: 200, body: result };
  }

  if (method === "DELETE") {
    const result = await deleteRoom(body?.id, body?.ownerToken, userId);
    return { statusCode: 200, body: result };
  }

  return {
    statusCode: 405,
    headers: { Allow: "GET, POST, PUT, PATCH, DELETE" },
    body: { error: "Method not allowed" },
  };
}

export { isExpired, publicRoom, assertOwnerAccess, isAccountOwner };

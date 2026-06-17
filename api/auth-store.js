import { get, put } from "@vercel/blob";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const USER_ID_BYTES = 12;
const LOCAL_AUTH_DIR = resolve(process.cwd(), ".vercel", "auth-cache");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function makeId(byteLength) {
  return randomBytes(byteLength).toString("base64url");
}

function shouldUseLocalAuthStore() {
  return process.env.VERCEL !== "1" && !process.env.BLOB_READ_WRITE_TOKEN;
}

function getUserPath(userId) {
  return `quiz-mix/users/${userId}.json`;
}

function getEmailIndexPath(email) {
  const normalized = normalizeEmail(email);
  const hash = Buffer.from(normalized).toString("base64url");
  return `quiz-mix/users-by-email/${hash}.json`;
}

function getUserRoomsPath(userId) {
  return `quiz-mix/user-rooms/${userId}.json`;
}

function getLocalFile(relativePath) {
  return resolve(LOCAL_AUTH_DIR, relativePath);
}

async function readJsonBlob(pathname) {
  if (shouldUseLocalAuthStore()) {
    try {
      return JSON.parse(await readFile(getLocalFile(pathname), "utf-8"));
    } catch (error) {
      if (error?.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || !result.stream || result.statusCode === 404) {
    return null;
  }

  const reader = result.stream.getReader();
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
  return JSON.parse(text);
}

async function writeJsonBlob(pathname, payload) {
  const body = JSON.stringify(payload);
  if (shouldUseLocalAuthStore()) {
    const filePath = getLocalFile(pathname);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, body, "utf-8");
    return;
  }

  await put(pathname, body, {
    access: "private",
    contentType: "application/json; charset=utf-8",
    allowOverwrite: true,
  });
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!EMAIL_PATTERN.test(normalized)) {
    throw Object.assign(new Error("Invalid email address."), { statusCode: 400 });
  }
  return normalized;
}

export function validatePassword(password) {
  const value = String(password || "");
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw Object.assign(new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`), { statusCode: 400 });
  }
  return value;
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt.toString("base64url")}:${Buffer.from(derived).toString("base64url")}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string" || !storedHash.startsWith("scrypt:")) {
    return false;
  }

  const [, saltEncoded, hashEncoded] = storedHash.split(":");
  if (!saltEncoded || !hashEncoded) {
    return false;
  }

  const salt = Buffer.from(saltEncoded, "base64url");
  const expected = Buffer.from(hashEncoded, "base64url");
  const derived = await scryptAsync(password, salt, expected.length);
  const actual = Buffer.from(derived);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function readUserById(userId) {
  if (!userId || typeof userId !== "string") {
    return null;
  }
  const user = await readJsonBlob(getUserPath(userId));
  if (!user || user.id !== userId) {
    return null;
  }
  return user;
}

export async function readUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }

  const index = await readJsonBlob(getEmailIndexPath(normalized));
  if (!index?.userId) {
    return null;
  }

  return readUserById(index.userId);
}

export async function createUser(email, password) {
  const normalizedEmail = validateEmail(email);
  validatePassword(password);

  const existing = await readUserByEmail(normalizedEmail);
  if (existing) {
    throw Object.assign(new Error("An account with this email already exists."), { statusCode: 409 });
  }

  const id = makeId(USER_ID_BYTES);
  const now = new Date().toISOString();
  const user = {
    id,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };

  await writeJsonBlob(getUserPath(id), user);
  await writeJsonBlob(getEmailIndexPath(normalizedEmail), { userId: id, email: normalizedEmail });
  await writeJsonBlob(getUserRoomsPath(id), { roomIds: [] });

  return publicUser(user);
}

export async function authenticateUser(email, password) {
  const normalizedEmail = validateEmail(email);
  const user = await readUserByEmail(normalizedEmail);
  if (!user) {
    throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
  }

  const valid = await verifyPassword(validatePassword(password), user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });
  }

  return publicUser(user);
}

export async function listUserRoomIds(userId) {
  const payload = await readJsonBlob(getUserRoomsPath(userId));
  if (!payload || !Array.isArray(payload.roomIds)) {
    return [];
  }
  return payload.roomIds.filter((roomId) => typeof roomId === "string" && roomId);
}

export async function addUserRoom(userId, roomId) {
  const roomIds = await listUserRoomIds(userId);
  if (!roomIds.includes(roomId)) {
    roomIds.push(roomId);
    await writeJsonBlob(getUserRoomsPath(userId), { roomIds });
  }
}

export async function removeUserRoom(userId, roomId) {
  if (!userId || typeof userId !== "string" || !roomId || typeof roomId !== "string") {
    return;
  }

  const roomIds = (await listUserRoomIds(userId)).filter((id) => id !== roomId);
  await writeJsonBlob(getUserRoomsPath(userId), { roomIds });
}

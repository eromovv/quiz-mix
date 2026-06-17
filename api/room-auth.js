const HOUR_MS = 60 * 60 * 1000;

export const ACCESS_TOKEN_BYTES = 24;
export const DEFAULT_ACCESS_TOKEN_TTL_HOURS = 168;
export const DEFAULT_OWNER_TOKEN_TTL_HOURS = 720;

export function getAccessTokenTtlMs() {
  return parseTtlHours(process.env.ROOM_ACCESS_TOKEN_TTL_HOURS, DEFAULT_ACCESS_TOKEN_TTL_HOURS);
}

export function getOwnerTokenTtlMs() {
  return parseTtlHours(process.env.ROOM_OWNER_TOKEN_TTL_HOURS, DEFAULT_OWNER_TOKEN_TTL_HOURS);
}

function parseTtlHours(raw, fallbackHours) {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallbackHours * HOUR_MS;
  }
  return parsed * HOUR_MS;
}

export function makeExpiryDate(ttlMs) {
  return new Date(Date.now() + ttlMs).toISOString();
}

export function isExpired(expiresAt) {
  if (!expiresAt || typeof expiresAt !== "string") {
    return true;
  }
  const time = Date.parse(expiresAt);
  return !Number.isFinite(time) || time <= Date.now();
}

export function assertNotExpired(expiresAt, message, statusCode = 401) {
  if (isExpired(expiresAt)) {
    throw Object.assign(new Error(message), { statusCode, code: "TOKEN_EXPIRED" });
  }
}

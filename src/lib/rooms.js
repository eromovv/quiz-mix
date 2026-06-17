const ROOMS_API = "/api/rooms";
const ROOM_OWNER_TOKENS_KEY = "quiz_room_owner_tokens";
const ROOM_ACCESS_TOKENS_KEY = "quiz_room_access_tokens";
const ROOM_META_KEY = "quiz_room_meta";

const defaultFetchOptions = {
  credentials: "include",
};

class RoomRequestError extends Error {
  constructor(message, { statusCode, code } = {}) {
    super(message);
    this.name = "RoomRequestError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new RoomRequestError(payload.error || "Не удалось выполнить запрос комнаты.", {
      statusCode: response.status,
      code: payload.code,
    });
  }
  return payload;
}

function readTokenMap(storageKey) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTokenMap(storageKey, tokens) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(tokens));
}

function buildRoomUrl(path, params) {
  const url = new URL(path, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

export async function fetchRoom(roomId, token) {
  const requestUrl = buildRoomUrl(ROOMS_API, { id: roomId, token });
  const payload = await readJsonResponse(await fetch(requestUrl, defaultFetchOptions));
  return payload;
}

export async function createRoom(cards) {
  const payload = await readJsonResponse(
    await fetch(ROOMS_API, {
      ...defaultFetchOptions,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    }),
  );
  return payload;
}

export async function updateRoom(roomId, ownerToken, cards) {
  const payload = await readJsonResponse(
    await fetch(ROOMS_API, {
      ...defaultFetchOptions,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId, ownerToken, cards }),
    }),
  );
  return payload;
}

export async function renewRoomAccessToken(roomId, ownerToken) {
  const payload = await readJsonResponse(
    await fetch(ROOMS_API, {
      ...defaultFetchOptions,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId, ownerToken }),
    }),
  );
  return payload;
}

export function getOwnedRooms() {
  return readTokenMap(ROOM_OWNER_TOKENS_KEY);
}

export function getRoomOwnerToken(roomId) {
  return readTokenMap(ROOM_OWNER_TOKENS_KEY)[roomId] || "";
}

export function saveRoomOwnerToken(roomId, ownerToken) {
  if (typeof window === "undefined" || !roomId || !ownerToken) {
    return;
  }

  const tokens = readTokenMap(ROOM_OWNER_TOKENS_KEY);
  tokens[roomId] = ownerToken;
  writeTokenMap(ROOM_OWNER_TOKENS_KEY, tokens);
}

export function clearRoomOwnerToken(roomId) {
  if (typeof window === "undefined" || !roomId) {
    return;
  }

  const tokens = readTokenMap(ROOM_OWNER_TOKENS_KEY);
  delete tokens[roomId];
  writeTokenMap(ROOM_OWNER_TOKENS_KEY, tokens);
}

export function getRoomAccessToken(roomId) {
  return readTokenMap(ROOM_ACCESS_TOKENS_KEY)[roomId] || "";
}

export function saveRoomAccessToken(roomId, accessToken) {
  if (typeof window === "undefined" || !roomId || !accessToken) {
    return;
  }

  const tokens = readTokenMap(ROOM_ACCESS_TOKENS_KEY);
  tokens[roomId] = accessToken;
  writeTokenMap(ROOM_ACCESS_TOKENS_KEY, tokens);
}

export function clearRoomAccessToken(roomId) {
  if (typeof window === "undefined" || !roomId) {
    return;
  }

  const tokens = readTokenMap(ROOM_ACCESS_TOKENS_KEY);
  delete tokens[roomId];
  writeTokenMap(ROOM_ACCESS_TOKENS_KEY, tokens);
}

export function resolveRoomToken(roomId) {
  return getRoomOwnerToken(roomId) || getRoomAccessToken(roomId);
}

export function captureAccessTokenFromUrl(roomId) {
  if (typeof window === "undefined" || !roomId) {
    return getRoomAccessToken(roomId);
  }

  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("t") || params.get("token");
  if (urlToken) {
    saveRoomAccessToken(roomId, urlToken);
    params.delete("t");
    params.delete("token");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
    return urlToken;
  }

  return getRoomAccessToken(roomId);
}

export function makeRoomShareUrl(roomId) {
  if (typeof window === "undefined") {
    return `/room/${roomId}`;
  }

  const base = import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/room/${roomId}`;
}

export function getRoomMeta(roomId) {
  const meta = readTokenMap(ROOM_META_KEY)[roomId];
  return meta && typeof meta === "object" ? meta : {};
}

export function saveRoomMeta(roomId, meta) {
  if (typeof window === "undefined" || !roomId || !meta) {
    return;
  }

  const all = readTokenMap(ROOM_META_KEY);
  all[roomId] = {
    accessTokenExpiresAt: meta.accessTokenExpiresAt || "",
    ownerTokenExpiresAt: meta.ownerTokenExpiresAt || "",
  };
  writeTokenMap(ROOM_META_KEY, all);
}

export function rememberRoomCredentials(roomId, { ownerToken, accessToken, room } = {}) {
  if (ownerToken) {
    saveRoomOwnerToken(roomId, ownerToken);
  }
  if (accessToken) {
    saveRoomAccessToken(roomId, accessToken);
  }
  if (room) {
    saveRoomMeta(roomId, room);
  }
}

export function formatTokenExpiry(isoDate, language) {
  if (!isoDate) {
    return "";
  }

  const time = Date.parse(isoDate);
  if (!Number.isFinite(time)) {
    return "";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(time));
}

export { RoomRequestError };

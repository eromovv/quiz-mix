import {
  clearRoomAccessToken,
  clearRoomOwnerToken,
  fetchRoom,
  getOwnedRooms,
  getRoomMeta,
  getRoomOwnerToken,
  rememberRoomCredentials,
  RoomRequestError,
} from "./rooms.js";

export const USER_SESSION_KEY = "quiz_user_session";
export const LAST_ROOM_ID_KEY = "quiz_last_room_id";
const AUTH_EVENT = "quiz-auth-changed";

/** @typedef {{ roomId: string, role: "owner"|"guest", expiresAt: string, loggedInAt: string }} UserSession */

export function loadUserSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(USER_SESSION_KEY) || "null");
    if (!parsed || typeof parsed !== "object" || !parsed.roomId || !parsed.role) {
      return null;
    }
    return {
      roomId: String(parsed.roomId),
      role: parsed.role === "owner" ? "owner" : "guest",
      expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : "",
      loggedInAt: typeof parsed.loggedInAt === "string" ? parsed.loggedInAt : "",
    };
  } catch {
    return null;
  }
}

export function saveUserSession(session) {
  if (typeof window === "undefined" || !session) {
    return;
  }

  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: session }));
}

export function clearUserSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(USER_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
}

export function subscribeUserSession(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleChange(event) {
    listener(event.detail ?? loadUserSession());
  }

  window.addEventListener(AUTH_EVENT, handleChange);
  return () => window.removeEventListener(AUTH_EVENT, handleChange);
}

export function isUserSessionValid(session) {
  if (!session?.roomId || !session?.role) {
    return false;
  }

  if (!session.expiresAt) {
    return session.role === "owner" ? Boolean(getRoomOwnerToken(session.roomId)) : true;
  }

  const time = Date.parse(session.expiresAt);
  return Number.isFinite(time) && time > Date.now();
}

export function resolveInitialUserSession() {
  const stored = loadUserSession();
  if (stored && isUserSessionValid(stored)) {
    return stored;
  }

  if (stored) {
    clearUserSession();
  }

  return inferSessionFromLocalTokens();
}

function inferSessionFromLocalTokens() {
  const owned = getOwnedRooms();
  const roomId = window.localStorage.getItem(LAST_ROOM_ID_KEY) || Object.keys(owned)[0] || "";
  if (!roomId || !owned[roomId]) {
    return null;
  }

  const meta = getRoomMeta(roomId);
  const session = {
    roomId,
    role: "owner",
    expiresAt: meta.ownerTokenExpiresAt || "",
    loggedInAt: "",
  };

  if (!isUserSessionValid(session)) {
    return null;
  }

  saveUserSession(session);
  return session;
}

/**
 * @param {string} roomId
 * @param {"owner"|"guest"} role
 * @param {{ ownerTokenExpiresAt?: string, accessTokenExpiresAt?: string }} room
 */
export function establishUserSession(roomId, role, room) {
  const session = {
    roomId,
    role,
    expiresAt: role === "owner" ? room.ownerTokenExpiresAt || "" : "",
    loggedInAt: new Date().toISOString(),
  };
  saveUserSession(session);
  return session;
}

export function logoutUser() {
  const session = loadUserSession();
  if (session?.roomId) {
    if (session.role === "owner") {
      clearRoomOwnerToken(session.roomId);
    } else {
      clearRoomAccessToken(session.roomId);
    }
  }
  clearUserSession();
}

export function logoutRoomSession() {
  logoutUser();
}

const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{8,32}$/;

export function parseRoomAuthLink(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return null;
  }

  if (ROOM_ID_PATTERN.test(trimmed)) {
    return { roomId: trimmed, token: "" };
  }

  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(trimmed, window.location.origin);
    const match = url.pathname.match(/\/room\/([^/]+)/);
    const roomId = match?.[1] || "";
    const token = url.searchParams.get("t") || url.searchParams.get("token") || "";
    if (roomId) {
      return { roomId, token };
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function loginWithCredentials(roomId, token = "") {
  const normalizedRoomId = String(roomId || "").trim();
  const normalizedToken = String(token || "").trim();
  if (!normalizedRoomId) {
    throw new Error("Room id is required.");
  }

  const payload = await fetchRoom(normalizedRoomId, normalizedToken);
  const role = payload.role === "owner" ? "owner" : "guest";

  rememberRoomCredentials(normalizedRoomId, {
    ownerToken: role === "owner" ? normalizedToken || payload.ownerToken || "" : payload.ownerToken || "",
    accessToken: payload.accessToken || "",
    room: payload.room,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_ROOM_ID_KEY, normalizedRoomId);
  }

  return {
    session: establishUserSession(normalizedRoomId, role, payload.room),
    room: payload.room,
    role,
  };
}

export function getUserSessionLabel(session, t) {
  if (!session) {
    return "";
  }

  const roleLabel = session.role === "owner" ? t("authRoleOwner") : t("authRoleGuest");
  return t("authSessionLabel", { role: roleLabel, roomId: session.roomId });
}

export { RoomRequestError };

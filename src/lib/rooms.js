const ROOMS_API = "/api/rooms";
const ROOM_OWNER_TOKENS_KEY = "quiz_room_owner_tokens";

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Не удалось выполнить запрос комнаты.");
  }
  return payload;
}

export async function fetchRoom(roomId) {
  const payload = await readJsonResponse(await fetch(`${ROOMS_API}?id=${encodeURIComponent(roomId)}`));
  return payload.room;
}

export async function createRoom(cards) {
  const payload = await readJsonResponse(
    await fetch(ROOMS_API, {
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId, ownerToken, cards }),
    }),
  );
  return payload.room;
}

function readOwnerTokens() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(ROOM_OWNER_TOKENS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getOwnedRooms() {
  return readOwnerTokens();
}

export function getRoomOwnerToken(roomId) {
  return readOwnerTokens()[roomId] || "";
}

export function saveRoomOwnerToken(roomId, ownerToken) {
  if (typeof window === "undefined" || !roomId || !ownerToken) {
    return;
  }

  const tokens = readOwnerTokens();
  tokens[roomId] = ownerToken;
  window.localStorage.setItem(ROOM_OWNER_TOKENS_KEY, JSON.stringify(tokens));
}

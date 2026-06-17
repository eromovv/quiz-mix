const AUTH_API = "/api/auth";
const ACCOUNT_EVENT = "quiz-account-changed";

export class AccountRequestError extends Error {
  constructor(message, { statusCode, code } = {}) {
    super(message);
    this.name = "AccountRequestError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AccountRequestError(payload.error || "Account request failed.", {
      statusCode: response.status,
      code: payload.code,
    });
  }
  return payload;
}

function authFetch(url, options = {}) {
  return fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

function notifyAccountChange(user) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(ACCOUNT_EVENT, { detail: user }));
}

export async function fetchAccount() {
  const payload = await readJsonResponse(await authFetch(AUTH_API));
  return payload.user || null;
}

export async function registerAccount(email, password) {
  const payload = await readJsonResponse(
    await authFetch(AUTH_API, {
      method: "POST",
      body: JSON.stringify({ action: "register", email, password }),
    }),
  );
  notifyAccountChange(payload.user);
  return payload.user;
}

export async function loginAccount(email, password) {
  const payload = await readJsonResponse(
    await authFetch(AUTH_API, {
      method: "POST",
      body: JSON.stringify({ action: "login", email, password }),
    }),
  );
  notifyAccountChange(payload.user);
  return payload.user;
}

export async function logoutAccount() {
  await readJsonResponse(
    await authFetch(AUTH_API, {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    }),
  );
  notifyAccountChange(null);
}

export async function fetchMyRooms() {
  const payload = await readJsonResponse(await authFetch(`${AUTH_API}?list=rooms`));
  return Array.isArray(payload.rooms) ? payload.rooms : [];
}

export async function claimRoomForAccount(roomId, ownerToken) {
  const payload = await readJsonResponse(
    await authFetch(AUTH_API, {
      method: "POST",
      body: JSON.stringify({ action: "claim-room", roomId, ownerToken }),
    }),
  );
  return payload;
}

export function subscribeAccount(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleChange(event) {
    listener(event.detail ?? null);
  }

  window.addEventListener(ACCOUNT_EVENT, handleChange);
  return () => window.removeEventListener(ACCOUNT_EVENT, handleChange);
}

export function getAccountLabel(user, t) {
  if (!user?.email) {
    return "";
  }
  return t("accountSessionLabel", { email: user.email });
}

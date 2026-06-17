import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "quiz_auth";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.VERCEL === "1") {
    throw Object.assign(new Error("AUTH_SESSION_SECRET is not configured."), { statusCode: 500 });
  }
  return "quiz-mix-dev-session-secret";
}

export function createSessionToken(userId) {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const separator = token.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");

  try {
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!data?.userId || typeof data.userId !== "string") {
      return null;
    }
    if (!Number.isFinite(data.exp) || data.exp <= Date.now()) {
      return null;
    }
    return data.userId;
  } catch {
    return null;
  }
}

export function parseCookieHeader(header) {
  const cookies = {};
  if (!header || typeof header !== "string") {
    return cookies;
  }

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

export function getUserIdFromRequest(request) {
  const header = request?.headers?.cookie || request?.headers?.Cookie || "";
  const cookies = parseCookieHeader(header);
  return verifySessionToken(cookies[AUTH_COOKIE_NAME]);
}

export function buildSessionCookie(token) {
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];

  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function buildClearSessionCookie() {
  const parts = [`${AUTH_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

import { addUserRoom, authenticateUser, createUser, listUserRoomIds, readUserById } from "./auth-store.js";
import { claimRoomForUser, listRoomsForUser } from "./rooms-core.js";
import {
  buildClearSessionCookie,
  buildSessionCookie,
  createSessionToken,
  getUserIdFromRequest,
} from "./session-cookie.js";

function getStatusCode(error) {
  return Number.isInteger(error?.statusCode) ? error.statusCode : 400;
}

export async function handleAuthRequest(method, query, body, request) {
  if (method === "GET") {
    if (query.list === "rooms") {
      const userId = getUserIdFromRequest(request);
      if (!userId) {
        throw Object.assign(new Error("Authentication required."), { statusCode: 401 });
      }
      const rooms = await listRoomsForUser(userId);
      return { statusCode: 200, body: { rooms } };
    }

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return { statusCode: 200, body: { user: null } };
    }

    const user = await readUserById(userId);
    if (!user) {
      return {
        statusCode: 200,
        body: { user: null },
        headers: { "Set-Cookie": buildClearSessionCookie() },
      };
    }

    return {
      statusCode: 200,
      body: { user: { id: user.id, email: user.email, createdAt: user.createdAt } },
    };
  }

  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "GET, POST" },
      body: { error: "Method not allowed" },
    };
  }

  const action = body?.action;

  if (action === "register") {
    const user = await createUser(body?.email, body?.password);
    const token = createSessionToken(user.id);
    return {
      statusCode: 201,
      body: { user },
      headers: { "Set-Cookie": buildSessionCookie(token) },
    };
  }

  if (action === "login") {
    const user = await authenticateUser(body?.email, body?.password);
    const token = createSessionToken(user.id);
    return {
      statusCode: 200,
      body: { user },
      headers: { "Set-Cookie": buildSessionCookie(token) },
    };
  }

  if (action === "logout") {
    return {
      statusCode: 200,
      body: { ok: true },
      headers: { "Set-Cookie": buildClearSessionCookie() },
    };
  }

  if (action === "claim-room") {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      throw Object.assign(new Error("Authentication required."), { statusCode: 401 });
    }

    const result = await claimRoomForUser(body?.roomId, body?.ownerToken, userId);
    await addUserRoom(userId, result.room.id);
    return { statusCode: 200, body: result };
  }

  return {
    statusCode: 400,
    body: { error: "Unknown auth action." },
  };
}

export async function runAuthRequest(method, query, body, request) {
  try {
    return await handleAuthRequest(method, query, body, request);
  } catch (error) {
    return {
      statusCode: getStatusCode(error),
      body: {
        error: error instanceof Error ? error.message : "Auth request failed",
        code: error?.code,
      },
    };
  }
}

export { getUserIdFromRequest, listUserRoomIds };

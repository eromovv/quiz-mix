import { handleRoomsRequest } from "./rooms-core.js";

function getStatusCode(error) {
  return Number.isInteger(error?.statusCode) ? error.statusCode : 400;
}

export default async function handler(request, response) {
  try {
    const result = await handleRoomsRequest(request.method, request.query || {}, request.body || {});
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        response.setHeader(key, value);
      }
    }
    return response.status(result.statusCode).json(result.body);
  } catch (error) {
    return response.status(getStatusCode(error)).json({ error: error instanceof Error ? error.message : "Room request failed" });
  }
}

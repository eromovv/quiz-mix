import { runAuthRequest } from "./auth-core.js";

function applyHeaders(response, headers) {
  if (!headers) {
    return;
  }
  for (const [key, value] of Object.entries(headers)) {
    response.setHeader(key, value);
  }
}

export default async function handler(request, response) {
  const result = await runAuthRequest(request.method, request.query || {}, request.body || {}, request);
  applyHeaders(response, result.headers);
  return response.status(result.statusCode).json(result.body);
}

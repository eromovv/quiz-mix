import { Readable } from "node:stream";
import { getBlobMedia } from "./blob-media-core.js";

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const target = request.query.url || request.query.pathname;
    const result = await getBlobMedia(Array.isArray(target) ? target[0] : target, request.headers);

    if (!result || !result.stream) {
      return response.status(404).json({ error: "Blob not found" });
    }

    result.headers.forEach((value, key) => {
      response.setHeader(key, value);
    });
    response.status(result.headers.has("content-range") ? 206 : result.statusCode);
    if (request.method === "HEAD") {
      return response.end();
    }
    return Readable.fromWeb(result.stream).pipe(response);
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : "Media request failed" });
  }
}

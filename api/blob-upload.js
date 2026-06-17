import { handleBlobUpload } from "./blob-upload-core.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const jsonResponse = await handleBlobUpload(request, request.body);

    return response.status(200).json(jsonResponse);
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 400;
    return response.status(statusCode).json({
      error: error instanceof Error ? error.message : "Upload failed",
      code: error?.code,
    });
  }
}

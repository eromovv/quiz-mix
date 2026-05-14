import { handleUpload } from "@vercel/blob/client";

const ALLOWED_CONTENT_TYPES = [
  "audio/*",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

export function handleBlobUpload(request, body) {
  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ALLOWED_CONTENT_TYPES,
      addRandomSuffix: true,
    }),
    onUploadCompleted: async () => {},
  });
}

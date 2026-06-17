import { handleUpload } from "@vercel/blob/client";
import { assertBlobUploadAccess } from "./rooms-core.js";
import { getUserIdFromRequest } from "./session-cookie.js";

const ALLOWED_CONTENT_TYPES = [
  "audio/*",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

function parseClientPayload(raw) {
  if (!raw) {
    return {};
  }
  if (typeof raw === "object") {
    return raw;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function handleBlobUpload(request, body) {
  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const payload = parseClientPayload(clientPayload);
      const roomId = payload.roomId;
      const ownerToken = payload.ownerToken || "";
      const userId = getUserIdFromRequest(request);

      if (!roomId) {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
        };
      }

      await assertBlobUploadAccess(roomId, { ownerToken, userId });

      return {
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        addRandomSuffix: true,
      };
    },
    onUploadCompleted: async () => {},
  });
}

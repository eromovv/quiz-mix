import { get } from "@vercel/blob";

function assertAllowedBlobTarget(urlOrPathname) {
  if (!urlOrPathname || typeof urlOrPathname !== "string") {
    throw new Error("Missing blob URL.");
  }

  if (urlOrPathname.startsWith("quiz-mix/")) {
    return;
  }

  const url = new URL(urlOrPathname);
  const isPrivateBlob = url.hostname.endsWith(".private.blob.vercel-storage.com");
  if (!isPrivateBlob || !url.pathname.startsWith("/quiz-mix/")) {
    throw new Error("Blob URL is not allowed.");
  }
}

export async function getBlobMedia(urlOrPathname, requestHeaders = {}) {
  assertAllowedBlobTarget(urlOrPathname);

  const rangeHeader = requestHeaders.range || requestHeaders.Range;
  const headers = rangeHeader ? { Range: rangeHeader } : undefined;
  return get(urlOrPathname, {
    access: "private",
    headers,
  });
}

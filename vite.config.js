import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { getBlobMedia } from "./api/blob-media-core.js";
import { handleBlobUpload } from "./api/blob-upload-core.js";
import { handleRoomsRequest } from "./api/rooms-core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));
const repoName = typeof pkg.name === "string" ? pkg.name : "quiz-mix";

/**
 * GitHub Pages (project site): user.github.io/repo/ → base `/${repoName}/`.
 * Vercel и прочий хостинг с корневым URL → base "/".
 */
function copyIndexTo404() {
  const from = resolve(__dirname, "dist/index.html");
  const to = resolve(__dirname, "dist/404.html");
  if (existsSync(from)) {
    copyFileSync(from, to);
  }
}

function readJsonBody(req) {
  return new Promise((resolveJson, reject) => {
    let raw = "";

    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolveJson(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function blobUploadDevMiddleware() {
  return {
    name: "blob-upload-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url || "/", "http://localhost").pathname;
        if (pathname !== "/api/blob-upload") {
          next();
          return;
        }

        res.setHeader("Content-Type", "application/json");

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const body = await readJsonBody(req);
          const jsonResponse = await handleBlobUpload(req, body);
          res.statusCode = 200;
          res.end(JSON.stringify(jsonResponse));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }));
        }
      });
    },
  };
}

function blobMediaDevMiddleware() {
  return {
    name: "blob-media-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        if (url.pathname !== "/api/blob-media") {
          next();
          return;
        }

        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405;
          res.setHeader("Allow", "GET, HEAD");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const target = url.searchParams.get("url") || url.searchParams.get("pathname");
          const result = await getBlobMedia(target, req.headers);
          if (!result || !result.stream) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Blob not found" }));
            return;
          }

          result.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          res.statusCode = result.headers.has("content-range") ? 206 : result.statusCode;
          if (req.method === "HEAD") {
            res.end();
            return;
          }
          Readable.fromWeb(result.stream).pipe(res);
        } catch (error) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Media request failed" }));
        }
      });
    },
  };
}

function roomsDevMiddleware() {
  return {
    name: "rooms-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        if (url.pathname !== "/api/rooms") {
          next();
          return;
        }

        res.setHeader("Content-Type", "application/json");

        try {
          const query = Object.fromEntries(url.searchParams.entries());
          const body = req.method === "GET" ? {} : await readJsonBody(req);
          const result = await handleRoomsRequest(req.method, query, body);
          if (result.headers) {
            for (const [key, value] of Object.entries(result.headers)) {
              res.setHeader(key, value);
            }
          }
          res.statusCode = result.statusCode;
          res.end(JSON.stringify(result.body));
        } catch (error) {
          res.statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 400;
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Room request failed" }));
        }
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, __dirname, "");
  if (!process.env.BLOB_READ_WRITE_TOKEN && env.BLOB_READ_WRITE_TOKEN) {
    process.env.BLOB_READ_WRITE_TOKEN = env.BLOB_READ_WRITE_TOKEN;
  }
  const isVercel = process.env.VERCEL === "1";
  const base = command === "build" && !isVercel ? `/${repoName}/` : "/";

  return {
    base,
    plugins: [
      react(),
      blobUploadDevMiddleware(),
      blobMediaDevMiddleware(),
      roomsDevMiddleware(),
      {
        name: "github-pages-spa-404",
        closeBundle: command === "build" && !isVercel ? copyIndexTo404 : () => {},
      },
    ],
  };
});

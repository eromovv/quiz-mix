import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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

export default defineConfig(({ command }) => {
  const isVercel = process.env.VERCEL === "1";
  const base = command === "build" && !isVercel ? `/${repoName}/` : "/";

  return {
    base,
    plugins: [
      react(),
      {
        name: "github-pages-spa-404",
        closeBundle: command === "build" && !isVercel ? copyIndexTo404 : () => {},
      },
    ],
  };
});

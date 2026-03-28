/**
 * GitHub Pages uses `next export` — Route Handlers and middleware are not supported.
 * Temporarily move them aside so `STATIC_EXPORT=true next build` can succeed.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const stash = path.join(root, ".gh-pages-stash");

fs.mkdirSync(stash, { recursive: true });

const middleware = path.join(root, "src", "middleware.ts");
if (fs.existsSync(middleware)) {
  fs.renameSync(middleware, path.join(stash, "middleware.ts"));
  console.log("gh-pages: stashed src/middleware.ts");
}

const apiDir = path.join(root, "src", "app", "api");
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, path.join(stash, "api"));
  console.log("gh-pages: stashed src/app/api");
}

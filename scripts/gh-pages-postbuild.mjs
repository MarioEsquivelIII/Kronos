import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const stash = path.join(root, ".gh-pages-stash");

const mw = path.join(stash, "middleware.ts");
if (fs.existsSync(mw)) {
  fs.renameSync(mw, path.join(root, "src", "middleware.ts"));
  console.log("gh-pages: restored src/middleware.ts");
}

const apiStash = path.join(stash, "api");
if (fs.existsSync(apiStash)) {
  fs.renameSync(apiStash, path.join(root, "src", "app", "api"));
  console.log("gh-pages: restored src/app/api");
}

if (fs.existsSync(stash)) {
  fs.rmSync(stash, { recursive: true, force: true });
}

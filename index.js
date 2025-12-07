import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entry = path.join(__dirname, "dist", "index.js");

if (!existsSync(entry)) {
  console.warn("dist/index.js missing — running npm run build before boot");
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error("npm run build failed; see output above");
  }
}

try {
  await import(pathToFileURL(entry).href);
} catch (err) {
  console.error("Failed to start Mastra entry at", entry);
  throw err;
}

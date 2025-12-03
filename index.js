// Render still launches `node index.js`, so forward to the compiled output.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entry = path.join(__dirname, "dist", "index.js");

try {
  await import(pathToFileURL(entry).href);
} catch (err) {
  console.error("Failed to start Mastra entry at", entry);
  throw err;
}

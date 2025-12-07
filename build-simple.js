// Simple build script that compiles TypeScript and sets up for deployment
import { execSync } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = (message) => console.log(`[build] ${message}`);

log("Building ara-guardian for deployment...");

try {
  if (!existsSync("dist")) {
    mkdirSync("dist", { recursive: true });
  }

  log("Compiling TypeScript via tsc");
  execSync("npx --package=typescript tsc", { stdio: "inherit" });

  log("Writing dist/index.js entry point");
  const entryPoint = `import "dotenv/config";
import mastra from "./mastra/index.js";
import { createNodeServer } from "@mastra/deployer/server";

async function start() {
  try {
    await createNodeServer(mastra, { tools: {} });
    const serverConfig = mastra.getServer() ?? {};
    const host = serverConfig.host ?? "0.0.0.0";
    const port = serverConfig.port ?? (Number(process.env.PORT) || 5000);
    console.log(
      \`[runtime] Mastra server listening on http://\${host}:\${port}\`
    );
  } catch (error) {
    console.error("[runtime] Failed to start Mastra server", error);
    process.exit(1);
  }
}

start();
`;

  writeFileSync(join(__dirname, "dist", "index.js"), entryPoint);

  log("Build complete (output in dist/)");
} catch (error) {
  console.error("[build] Build failed", error);
  process.exit(1);
}

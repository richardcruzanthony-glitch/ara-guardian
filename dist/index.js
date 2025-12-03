import mastra from "./mastra/index.js";
import { createNodeServer } from "@mastra/deployer/server";

async function start() {
  try {
    await createNodeServer(mastra, { tools: {} });
    const serverConfig = mastra.getServer() ?? {};
    const host = serverConfig.host ?? "0.0.0.0";
    const port = serverConfig.port ?? (Number(process.env.PORT) || 5000);
    console.log(
      `[runtime] Mastra server listening on http://${host}:${port}`
    );
  } catch (error) {
    console.error("[runtime] Failed to start Mastra server", error);
    process.exit(1);
  }
}

start();

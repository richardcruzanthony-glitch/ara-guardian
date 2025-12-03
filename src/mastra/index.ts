// IRON MODE — TELEMETRY DEAD FOREVER
process.env.MASTRA_TELEMETRY_ENABLED = "false";

import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

import { brainEngine } from "./tools/brainEngine.js";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing.js";
import { grokReasoning } from "./tools/grokReasoning.js";
import { gpt4o } from "./tools/gpt4o.js";
import { scraper } from "./tools/scraper.js";               // ← real-time web
import { skillInstaller } from "./tools/skillInstaller.js"; // ← infinite growth
import { adjuster } from "./tools/adjuster.js";             // ← never wrong twice
import { inngestServe } from "./inngest/index.js";
import { registerTelegramTrigger } from "../triggers/telegramTriggers.js";

export const mastra = new Mastra({
  telemetry: { enabled: false },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },
  mcpServers: {
    allTools: new MCPServer({ name: "allTools", version: "1.0.0", tools: {} }),
  },
});

registerTelegramTrigger(mastra);

if (Object.keys(mastra.getAgents()).length > 1) 
  throw new Error("Only 1 agent");

export default mastra;

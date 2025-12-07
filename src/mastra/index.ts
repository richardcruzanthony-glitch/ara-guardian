// IRON MODE — TELEMETRY DEAD FOREVER
process.env.MASTRA_TELEMETRY_ENABLED = "false";

import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

import { brainEngine } from "./tools/brainEngine.js";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing.js";
import { grokReasoning } from "./tools/grokReasoning.js";
import { gpt4o } from "./tools/gpt4o.js";
import { scraper } from "./tools/scraper.js";
import { skillInstaller } from "./tools/skillInstaller.js";
import { adjuster } from "./tools/adjuster.js";

import { inngestServe } from "./inngest/index.js";
import { registerTelegramTrigger } from "../triggers/telegramTriggers.js";
import { registerApiRoute } from "@mastra/core/server";

type ExtendedMastraConfig = ConstructorParameters<typeof Mastra>[0] & {
  tools?: unknown[];
  inngest?: { serve: typeof inngestServe };
};

// Secret API key
const AI_API_KEY = process.env.AI_API_KEY || "supersecretkey";

const mastraConfig: ExtendedMastraConfig = {
  telemetry: { enabled: false },
  tools: [
    brainEngine,
    generateQuote,
    getMaterialsList,
    grokReasoning,
    gpt4o,
    scraper,
    skillInstaller,
    adjuster,
  ],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
    apiRoutes: [
      // HTML Chat Frontend
      registerApiRoute("/", {
        method: "GET",

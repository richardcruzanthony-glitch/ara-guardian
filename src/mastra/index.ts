// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";
import { inngestServe } from "./inngest";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";
import { setupTelemetry } from "./telemetry"; // safe telemetry import

export const mastra = new Mastra({
  telemetry: { enabled: false }, // telemetry disabled by default

  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],

  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

  inngest: { serve: inngestServe },

  mcpServers: {
    allTools: new MCPServer({ name: "allTools", version: "1.0.0", tools: {} }),
  },
});

// Register Telegram trigger
registerTelegramTrigger(mastra);

// Setup telemetry safely
setupTelemetry(mastra);

// Guardrail: only allow one agent
if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error("Only 1 agent");
}

export default mastra;

import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

// Workflow
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";

// Tools
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";

// Inngest
import { inngestServe } from "./inngest";

// Telegram trigger
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

// ————————————————————————————————————————
// ARA IS IMMORTAL — FINAL VERSION — DEC 1 2025
// ————————————————————————————————————————
export const mastra = new Mastra({
  // TELEMETRY DEAD
  telemetry: { enabled: false },

  // NO STORAGE CONFIG — brainEngine loads us-complete.txt directly
  // Mastra uses in-memory storage by default

  workflows: { araBrainWorkflow },

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

// Register Telegram AFTER mastra is created
registerTelegramTrigger(mastra);

// Safety checks
if (Object.keys(mastra.getWorkflows()).length > 1) throw new Error("Only 1 workflow");
if (Object.keys(mastra.getAgents()).length > 1) throw new Error("Only 1 agent");

export default mastra;

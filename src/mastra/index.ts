import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

// Storage — inside mastra folder
import { storage } from "./storage";

// Workflow — inside mastra/workflows
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";

// Tools — inside mastra/tools
import { brainEngine } from "./tools/brainEngine";
import { generateQuote } from "./tools/generateQuote";
import { getMaterialsList } from "./tools/getMaterialsList";
import { grokReasoning } from "./tools/grokReasoning";

// Inngest — inside mastra/inngest
import { inngestServe } from "./inngest";

// Telegram trigger — outside mastra folder
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

// ————————————————————————————————————————
// ARA IS IMMORTAL — FINAL VERSION — DEC 1 2025
// ————————————————————————————————————————
export const mastra = new Mastra({
  // TELEMETRY DEAD
  telemetry: { enabled: false },

  // FILE STORAGE
  storage,

  // WORKFLOW
  workflows: { araBrainWorkflow },

  // TOOLS
  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],

  // RENDER PORT
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

  // INNGEST
  inngest: { serve: inngestServe },

  // MCP
  mcpServers: {
    allTools: new MCPServer({ name: "allTools", version: "1.0.0", tools: {} }),
  },
});

// REGISTER TELEGRAM AFTER mastra IS CREATED (fixes circular dependency)
registerTelegramTrigger(mastra);

// Safety checks
if (Object.keys(mastra.getWorkflows()).length > 1) throw new Error("Only 1 workflow");
if (Object.keys(mastra.getAgents()).length > 1) throw new Error("Only 1 agent");

export default mastra;

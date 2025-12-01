import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

import { araBrainWorkflow } from "./workflows/araBrainWorkflow";
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";
import { inngestServe } from "./inngest";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

export const mastra = new Mastra({
  // Telemetry disabled via env var — code line ignored by bundler
  telemetry: { enabled: false },

  // NO storage config — brainEngine loads us-complete.txt directly
  // Mastra defaults to in-memory storage (perfect for Render)

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

registerTelegramTrigger(mastra);

if (Object.keys(mastra.getWorkflows()).length > 1) throw new Error("Only 1 workflow");
if (Object.keys(mastra.getAgents()).length > 1) throw new Error("Only 1 agent");

export default mastra;

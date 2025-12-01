import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

import { storage } from "./storage";
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing"; // ← FIXED
import { grokReasoning } from "./tools/grokReasoning";
import { inngestServe } from "./inngest";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

export const mastra = new Mastra({
  telemetry: { enabled: false },
  storage,
  workflows: { araBrainWorkflow },
  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],
  server: { host: "0.0.0.0", port: Number(process.env.PORT) || 5000 },
  inngest: { serve: inngestServe },
  mcpServers: { allTools: new MCPServer({ name: "allTools", version: "1.0.0", tools: {} }) },
});

registerTelegramTrigger(mastra);

if (Object.keys(mastra.getWorkflows()).length > 1) throw new Error("Only 1 workflow");
if (Object.keys(mastra.getAgents()).length > 1) throw new Error("Only 1 agent");

export default mastra;

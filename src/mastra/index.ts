process.env.MASTRA_TELEMETRY_ENABLED = "false";

import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";
import { gpt4o } from "./tools/gpt4o";
import { inngestServe } from "./inngest";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

export const mastra = new Mastra({
  telemetry: { enabled: false },

  tools: [
    brainEngine,
    generateQuote,
    getMaterialsList,
    grokReasoning,
    gpt4o,
  ],

  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

  inngest: { serve: inngestServe },

  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {},
    }),
  },
});

registerTelegramTrigger(mastra);
import "../triggers/proactive";

if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error("Only 1 agent");
}

export default mastra;

import { Mastra } from "@mastra/core";
import { FileStore } from "@mastra/core/storage";
import { MCPServer } from "@mastra/mcp";

import { araBrainWorkflow } from "./workflows/araBrainWorkflow";

import { brainEngine } from "./tools/brainEngine";
import { guardianQuoteTool } from "./tools/guardianQuoteTool";
import { grokReasoning } from "./tools/grokReasoning";
import { getMaterialsList } from "./tools/guardianPricing"; // adjust if needed

import { inngestServe } from "./inngest";

// ---------------------------
// MAIN MASTRA CONFIG
// ---------------------------

export const mastra = new Mastra({
  telemetry: { enabled: false },

  storage: new FileStore({
    filePath: "/opt/render/project/src/us-complete.txt",
  }),

  workflows: {
    araBrainWorkflow,
  },

  tools: [
    brainEngine,
    guardianQuoteTool,
    getMaterialsList,
    grokReasoning,
  ],

  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

  inngest: {
    serve: inngestServe,
  },

  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {}, // you may later register MCP tools here
    }),
  },
});

import { Mastra } from "@mastra/core";
import { storage } from "./storage";

import { araBrainWorkflow } from "../workflows/araBrainWorkflow";
import { brainEngine } from "../tools/brainEngine";
import { generateQuote } from "../tools/generateQuote";
import { getMaterialsList } from "../tools/getMaterialsList";
import { grokReasoning } from "../tools/grokReasoning";

import { inngestServe } from "../inngest";
import { MCPServer } from "@mastra/mcp";

// -------------------------------
// MASTRA INSTANCE
// -------------------------------

export const mastra = new Mastra({
  telemetry: { enabled: false },

  // Shared storage (FileStore)
  storage,

  // Workflows
  workflows: {
    araBrainWorkflow,
  },

  // Tools
  tools: [
    brainEngine,
    generateQuote,
    getMaterialsList,
    grokReasoning,
  ],

  // HTTP Server
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

  // Inngest worker config
  inngest: {
    serve: inngestServe,
  },

  // MCP Servers
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {},
    }),
  },
});

export default mastra;


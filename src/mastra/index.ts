import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { MCPServer } from "@mastra/mcp";

import { inngest, inngestServe } from "./inngest";
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

// CREATE MASTRA FIRST
export const mastra = new Mastra({
  telemetry: { enabled: false },

  storage: {
    type: "file" as const,
    filePath: "/opt/render/project/src/us-complete.txt",
  },

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
  bundler: {
    externals: ["@slack/web-api", "inngest", "inngest/hono", "hono", "hono/streaming"],
    sourcemap: process.env.NODE_ENV !== "production",
  },
  logger:
    process.env.NODE_ENV === "production"
      ? new PinoLogger({ name: "Ara", level: "info" })
      : new PinoLogger({ name: "Ara", level: "debug", transport: { target: "pino-pretty" } }),

  apiRoutes: [
    {
      path: "/",
      method: "GET",
      handler: async (c) => c.html("YOUR HTML HERE"),
    },
    // ← your other routes
  ],
});

// NOW REGISTER TELEGRAM — AFTER mastra EXISTS
registerTelegramTrigger(mastra);

// Safety checks
if (Object.keys(mastra.getWorkflows()).length > 1) throw new Error("Only 1 workflow");
if (Object.keys(mastra.getAgents()).length > 1) throw new Error("Only 1 agent");

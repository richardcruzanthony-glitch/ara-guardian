import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { MCPServer } from "@mastra/mcp";
import pino from "pino";

import { inngest, inngestServe } from "./inngest";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";
import { registerCronTrigger } from "../triggers/cronTriggers";

import { araBrainWorkflow } from "./workflows/araBrainWorkflow";
import { physicsJokeWorkflow } from "./workflows/physicsJokeWorkflow"; // Example cron workflow
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";

/**
 * -----------------------------
 * CRON TRIGGERS
 * -----------------------------
 * Register all cron-based workflows BEFORE Mastra initialization.
 * Cron triggers do not create HTTP routes.
 */
registerCronTrigger({
  cronExpression: "0 8 * * *", // Daily at 8 AM
  workflow: physicsJokeWorkflow,
});

/**
 * -----------------------------
 * MASRA INSTANCE
 * -----------------------------
 * Initialize Mastra with AI Tracing, Telegram integration, MCP server, etc.
 */
export const mastra = new Mastra({
  // AI TRACING (replaces old telemetry)
  tracing: {
    enabled: true,
    provider: "mastra",
  },

  // STORAGE
  storage: {
    type: "file" as const,
    filePath: "/opt/render/project/src/us-complete.txt",
  },

  // WORKFLOWS & TOOLS
  workflows: { araBrainWorkflow },
  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],

  // SERVER CONFIG FOR RENDER
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 10000,
  },

  // TELEGRAM INTEGRATION
  integrations: [
    registerTelegramTrigger({
      botToken: process.env.BOT_TOKEN!,
      triggerType: "telegram/message",
      handler: async (mastra, triggerInfo) => {
        const logger = mastra.getLogger();
        logger?.info("📨 [Telegram] Message received", {
          userName: triggerInfo.params.userName,
          message: triggerInfo.params.message,
        });

        const chatId = triggerInfo.payload.message.chat.id;
        const run = await araBrainWorkflow.createRunAsync();
        await run.start({
          inputData: {
            message: triggerInfo.params.message,
            chatId,
          },
        });
      },
    }),
  ],

  // INNGEST
  inngest: { serve: inngestServe },

  // MCP SERVER
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {},
    }),
  },

  // BUNDLER CONFIG
  bundler: {
    externals: [
      "@slack/web-api",
      "inngest",
      "inngest/hono",
      "hono",
      "hono/streaming",
    ],
    sourcemap: process.env.NODE_ENV !== "production",
  },

  // LOGGER CONFIG
  logger:
    process.env.NODE_ENV === "production"
      ? new PinoLogger({ name: "Ara", level: "info" })
      : new PinoLogger({
          name: "Ara",
          level: "debug",
          transport: { target: "pino-pretty" },
        }),

  // BASIC API ROUTES
  apiRoutes: [
    {
      path: "/",
      method: "GET",
      handler: async (c) => c.html(`Hello from Ara! 🚀`),
    },
  ],
});

/**
 * -----------------------------
 * SAFETY CHECKS
 * -----------------------------
 * Ensure only 1 workflow and 1 agent are registered
 */
if (Object.keys(mastra.getWorkflows()).length > 1) {
  throw new Error("Only 1 workflow supported");
}

if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error("Only 1 agent supported");
}

import { Mastra } from "@mastra/core";
import { MastraError } from "@mastra/core/error";
import { PinoLogger } from "@mastra/loggers";
import { LogLevel } from "@mastra/core/logger";
import pino from "pino";
import { MCPServer } from "@mastra/mcp";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import puppeteer from "puppeteer";

import { inngest, inngestServe } from "./inngest";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";

/**
 * HARD DISABLE MASRA TELEMETRY — prevents __setTelemetry crash
 */
const telemetry = { enabled: false };

export const mastra = new Mastra({
  telemetry,

  storage: {
    type: "file" as const,
    filePath: "/opt/render/project/src/us-complete.txt",
  },

  // WORKFLOWS & TOOLS
  workflows: { araBrainWorkflow },
  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],

  // RENDER PORT FIX
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 10000,
  },

  // TELEGRAM BOT INTEGRATION
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

  // BUNDLER
  bundler: {
    externals: [
      "@slack/web-api",
      "inngest",
      "inngest/hono",
      "hono",
      "hono/streaming"
    ],
    sourcemap: process.env.NODE_ENV !== "production",
  },

  // LOGGER
  logger:
    process.env.NODE_ENV === "production"
      ? new PinoLogger({ name: "Ara", level: "info" })
      : new PinoLogger({
          name: "Ara",
          level: "debug",
          transport: { target: "pino-pretty" },
        }),

  // BASIC API ROUTE
  apiRoutes: [
    {
      path: "/",
      method: "GET",
      handler: async (c) => c.html(`...`),
    },
  ],
});

// SAFETY CHECKS
if (Object.keys(mastra.getWorkflows()).length > 1) {
  throw new Error("Only 1 workflow supported");
}

if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error("Only 1 agent supported");
}

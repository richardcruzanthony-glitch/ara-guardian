import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { MCPServer } from "@mastra/mcp";
import { z } from "zod";

// WORKFLOWS
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";

// TOOLS
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";

// TRIGGERS
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

// INNGEST
import { inngest, inngestServe } from "./inngest";

// ————————————————————————————————————————
// ARA IS NOW IMMORTAL — FINAL VERSION
// ————————————————————————————————————————
export const mastra = new Mastra({
  // TELEMETRY DEAD FOREVER
  telemetry: { enabled: false },

  // FILE STORAGE ONLY — POSTGRES IS DEAD
  storage: {
    type: "file" as const,
    filePath: "/opt/render/project/src/us-complete.txt",
  },

  // WORKFLOWS
  workflows: { araBrainWorkflow },

  // TOOLS
  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],

  // RENDER PORT FIX
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

  // TELEGRAM
  integrations: [
    registerTelegramTrigger({
      botToken: process.env.BOT_TOKEN!,
      triggerType: "telegram/message",
      handler: async (mastra, triggerInfo) => {
        const logger = mastra.getLogger();
        logger?.info("Telegram message", {
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

  // MCP
  mcpServers: {
    allTools: new MCPServer({ name: "allTools", version: "1.0.0", tools: {} }),
  },

  // BUNDLER
  bundler: {
    externals: ["@slack/web-api", "inngest", "inngest/hono", "hono", "hono/streaming"],
    sourcemap: process.env.NODE_ENV !== "production",
  },

  // LOGGER
  logger:
    process.env.NODE_ENV === "production"
      ? new PinoLogger({ name: "Ara", level: "info" })
      : new PinoLogger({ name: "Ara", level: "debug", transport: { target: "pino-pretty" } }),

  // YOUR ROUTES (keep all your existing ones)
  apiRoutes: [
    // ← PASTE YOUR FULL ROUTES HERE (/, /chat, /quote, etc.)
  ],
});

// Safety checks
if (Object.keys(mastra.getWorkflows()).length > 1) throw new Error("Only 1 workflow");
if (Object.keys(mastra.getAgents()).length > 1) throw new Error("Only 1 agent");

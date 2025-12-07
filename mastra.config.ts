// IRON MODE — TELEMETRY DEAD FOREVER
process.env.MASTRA_TELEMETRY_ENABLED = "false";

import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";

import { brainEngine } from "./tools/brainEngine.js";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing.js";
import { grokReasoning } from "./tools/grokReasoning.js";
import { gpt4o } from "./tools/gpt4o.js";
import { scraper } from "./tools/scraper.js";
import { skillInstaller } from "./tools/skillInstaller.js";
import { adjuster } from "./tools/adjuster.js";

import { inngestServe } from "./inngest/index.js";
import { registerTelegramTrigger } from "../triggers/telegramTriggers.js";
import { registerApiRoute } from "@mastra/core/server";

type ExtendedMastraConfig = ConstructorParameters<typeof Mastra>[0] & {
  tools?: unknown[];
  inngest?: { serve: typeof inngestServe };
};

// Replace this with your secret API key for your assistant
const AI_API_KEY = process.env.AI_API_KEY || "supersecretkey";

const mastraConfig: ExtendedMastraConfig = {
  telemetry: { enabled: false },
  tools: [
    brainEngine,
    generateQuote,
    getMaterialsList,
    grokReasoning,
    gpt4o,
    scraper,
    skillInstaller,
    adjuster,
  ],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
    apiRoutes: [
      // Root route — HTML homepage
      registerApiRoute("/", {
        method: "GET",
        handler: async (c) => {
          return c.html(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>ARA Guardian</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                h1 { color: #333; }
                a { color: #1a73e8; text-decoration: none; font-weight: bold; }
                a:hover { text-decoration: underline; }
                .box { background: #fff; padding: 20px; border-radius: 10px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>ARA Guardian</h1>
                <p>Mastra Server is <strong>running</strong>!</p>
                <p>Available routes:</p>
                <ul>
                  <li><a href="/my-custom-route">/my-custom-route</a></li>
                </ul>
                <p>Powered by <a href="https://mastra.ai" target="_blank">Mastra</a></p>
              </div>
            </body>
            </html>
          `);
        },
      }),

      // Example JSON route for testing
      registerApiRoute("/my-custom-route", {
        method: "GET",
        handler: async (c) => {
          return c.json({ message: "Hello from my custom route!" });
        },
      }),

      // Chat endpoint for your custom AI assistant
      registerApiRoute("/chat", {
        method: "POST",
        middleware: [
          async (c, next) => {
            const token = c.req.headers.get("Authorization");
            if (!token || token !== `Bearer ${AI_API_KEY}`) {
              return c.json({ error: "Unauthorized" }, 401);
            }
            await next();
          },
        ],
        handler: async (c) => {
          const { message } = await c.req.json();
          if (!message) return c.json({ error: "No message provided" }, 400);

          const agent = mastra.getAgents()["default"];
          if (!agent) return c.json({ error: "No agent found" }, 500);

          const reply = await agent.run(message);
          return c.json({ reply });
        },
      }),
    ],
  },
  inngest: { serve: inngestServe },
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {},
    }),
  },
};

export const mastra = new Mastra(mastraConfig);

// TELEGRAM IS BACK — FULLY COMPATIBLE
registerTelegramTrigger(mastra);

// ONLY ONE AGENT — KEEPS IT CLEAN
if (Object.keys(mastra.getAgents()).length > 1)
  throw new Error("Only 1 agent allowed");

export default mastra;

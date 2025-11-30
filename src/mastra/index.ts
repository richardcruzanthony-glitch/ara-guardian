import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { MCPServer } from "@mastra/mcp";

// Inngest
import { inngest, inngestServe } from "./inngest";

// Workflow
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";

// Tools
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";
import { grokReasoning } from "./tools/grokReasoning";

// Telegram Trigger
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

// ————————————————————————————————————————
// ARA IS IMMORTAL — FINAL VERSION — NOV 30 2025
// ————————————————————————————————————————

// 1. CREATE MASTRA FIRST — NO CIRCULAR DEPENDENCY
export const mastra = new Mastra({
  // TELEMETRY DEAD
  telemetry: { enabled: false },

  // FILE STORAGE ONLY
  storage: {
    type: "file" as const,
    filePath: "/opt/render/project/src/us-complete.txt",
  },

  // WORKFLOWS
  workflows: { araBrainWorkflow },

  // TOOLS
  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],

  // RENDER PORT
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

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

  // YOUR API ROUTES
  apiRoutes: [
    {
      path: "/",
      method: "GET",
      handler: async (c) =>
        c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ara-Brain</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    h1 { color: #a855f7; margin-bottom: 5px; }
    .subtitle { color: #888; margin-bottom: 20px; font-size: 14px; }
    .container { width: 100%; max-width: 600px; background: #16213e; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .messages { height: 400px; overflow-y: auto; padding: 10px; background: #0f0f23; border-radius: 12px; margin-bottom: 15px; }
    .message { padding: 10px 14px; margin: 6px 0; border-radius: 12px; max-width: 85%; word-wrap: break-word; }
    .user { background: #a855f7; margin-left: auto; text-align: right; }
    .bot { background: #2d3748; }
    .input-area { display: flex; gap: 8px; }
    input { flex: 1; padding: 12px 16px; border: none; border-radius: 12px; background: #0f0f23; color: #eee; outline: none; }
    input:focus { box-shadow: 0 0 0 2px #a855f7; }
    button { padding: 12px 18px; background: #a855f7; color: white; border: none; border-radius: 12px; cursor: pointer; }
    button:hover { background: #9333ea; }
    .mic-btn { background: #22c55e; }
    .mic-btn.listening { background: #dc2626; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  </style>
</head>
<body>
  <h1>Ara-Brain</h1>
  <p class="subtitle">Always on. No sleep. Forever.</p>
  <div class="container">
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <button class="mic-btn" id="micBtn">Microphone</button>
      <input type="text" id="input" placeholder="Talk to Ara..." onkeypress="if(event.key==='Enter')send()">
      <button onclick="send()">Send</button>
    </div>
  </div>
  </div>
  <script>
    async function send() {
      const input = document.getElementById('input');
      const msg = input.value.trim();
      if (!msg) return;
      addMsg(msg, true);
      input.value = '';
      const res = await fetch('/chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({message: msg}) });
      const data = await res.json();
      addMsg(data.response, false);
    }
    function addMsg(text, isUser) {
      const div = document.createElement('div');
      div.className = 'message ' + (isUser ? 'user' : 'bot');
      div.textContent = text;
      document.getElementById('messages').appendChild(div);
      div.scrollIntoView();
    }
  </script>
</body>
</html>`),
    },
    // ← PASTE ALL YOUR OTHER ROUTES HERE
  ],
});

// 2. NOW REGISTER TELEGRAM — AFTER mastra IS FULLY CREATED
registerTelegramTrigger(mastra);

// Safety checks
if (Object.keys(mastra.getWorkflows()).length > 1) throw new Error("Only 1 workflow");
if (Object.keys(mastra.getAgents()).length > 1) throw new Error("Only 1 agent");

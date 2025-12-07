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

// Secret API key for secure chat
const AI_API_KEY = process.env.AI_API_KEY || "supersecretkey";

// Type for Mastra config
type ExtendedMastraConfig = ConstructorParameters<typeof Mastra>[0] & {
  tools?: unknown[];
  inngest?: { serve: typeof inngestServe };
};

// Mastra configuration
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
      // Root route with live chat box
      registerApiRoute("/", {
        method: "GET",
        handler: async (c) => {
          return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ARA Guardian Chat</title>
<style>
body { font-family: Arial, sans-serif; background: #f5f5f5; text-align: center; padding: 50px; }
h1 { color: #333; }
.chat-box { background: #fff; padding: 20px; border-radius: 10px; width: 400px; margin: 0 auto; }
.messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; text-align: left; }
.message { margin: 5px 0; }
.message.user { color: blue; }
.message.ara { color: green; }
input[type="text"] { width: 70%; padding: 8px; }
button { padding: 8px 12px; }
</style>
</head>
<body>
<h1>ARA Guardian Chat</h1>
<div class="chat-box">
  <div id="messages" class="messages"></div>
  <input id="userInput" type="text" placeholder="Type your message..." />
  <button id="sendBtn">Send</button>
</div>

<script>
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = sender === "user" ? "You: " + text : "ARA: " + text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  appendMessage("user", text);
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${AI_API_KEY}"
      },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    appendMessage("ara", data.reply || "No response");
  } catch (err) {
    appendMessage("ara", "Error contacting server");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
</script>
</body>
</html>
          `);
        },
      }),

      // Test JSON route
      registerApiRoute("/my-custom-route", {
        method: "GET",
        handler: async (c) => {
          return c.json({ message: "Hello from my custom route!" });
        },
      }),

      // Chat API endpoint
      registerApiRoute("/chat", {
        method: "POST",
        middleware: [
          async (c, next) => {
            const token = c.req.headers.get("Authorization");
            if (!token || token !== \`Bearer \${AI_API_KEY}\`) {
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

// Instantiate Mastra
export const mastra = new Mastra(mastraConfig);

// TELEGRAM TRIGGERS
registerTelegramTrigger(mastra);

// Ensure only 1 agent exists
if (Object.keys(mastra.getAgents()).length > 1)
  throw new Error("Only 1 agent allowed");

export default mastra;

// IRON MODE — TELEMETRY DEAD FOREVER
import { AI_API_KEY, APP_PORT, authRequired } from "../config.js";
import { logger } from "../logger.js";
import { timingSafeEqual } from "crypto";
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
/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    try {
        const bufferA = Buffer.from(a, 'utf-8');
        const bufferB = Buffer.from(b, 'utf-8');
        return timingSafeEqual(bufferA, bufferB);
    }
    catch {
        return false;
    }
}
const mastraConfig = {
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
        port: APP_PORT,
        apiRoutes: [
            // HTML Chat Frontend
            registerApiRoute("/", {
                method: "GET",
                handler: async (c) => {
                    // NOTE: The API key is exposed in the frontend for simplicity.
                    // For production use, consider implementing a backend proxy or
                    // session-based authentication to avoid exposing the API key in client code.
                    // Current approach: Render API key into the page if authentication is enabled
                    const authHeader = authRequired() ? `'Authorization': 'Bearer ${AI_API_KEY}'` : '';
                    const headers = authRequired()
                        ? `'Content-Type': 'application/json', ${authHeader}`
                        : `'Content-Type': 'application/json'`;
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
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    function appendMessage(sender, text) {
      const div = document.createElement('div');
      div.className = 'message ' + sender;
      div.textContent = sender === 'user' ? 'You: ' + text : 'ARA: ' + text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      appendMessage('user', text);
      input.value = '';
      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: {
            ${headers}
          },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        appendMessage('ara', data.reply || 'No response');
      } catch (err) {
        appendMessage('ara', 'Error contacting server');
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
  </script>
</body>
</html>
          `);
                },
            }),
            // Chat Endpoint
            registerApiRoute("/chat", {
                method: "POST",
                middleware: [
                    async (c, next) => {
                        // Skip authentication if AI_API_KEY is not set (dev mode)
                        if (!authRequired()) {
                            logger.debug("Authentication disabled - no AI_API_KEY set");
                            await next();
                            return;
                        }
                        // Flexible header access for different middleware implementations
                        // Try multiple access patterns for compatibility
                        let authHeader = '';
                        try {
                            // Try header() method (most common in Hono)
                            authHeader = c.req.header('Authorization') || c.req.header('authorization') || '';
                        }
                        catch (e) {
                            // Fallback for other implementations
                            authHeader = '';
                        }
                        // Normalize and compare using constant-time comparison
                        const expectedToken = `bearer ${AI_API_KEY}`.toLowerCase();
                        const receivedToken = authHeader.toLowerCase();
                        if (!authHeader || !secureCompare(receivedToken, expectedToken)) {
                            logger.warn("Unauthorized access attempt to /chat", {
                                hasHeader: !!authHeader,
                                headerPrefix: authHeader.substring(0, 10)
                            });
                            return c.json({ error: "Unauthorized" }, 401);
                        }
                        await next();
                    },
                ],
                handler: async (c) => {
                    const { message } = await c.req.json();
                    if (!message)
                        return c.json({ error: "No message provided" }, 400);
                    const agents = mastra.getAgents();
                    const agentNames = Object.keys(agents);
                    if (agentNames.length === 0) {
                        logger.error("No agent found in mastra instance");
                        return c.json({ error: "No agent found" }, 500);
                    }
                    const agent = agents[agentNames[0]];
                    let reply;
                    try {
                        reply = await agent.run(message);
                    }
                    catch (e) {
                        logger.error('Agent run failed', e);
                        reply = "ARA could not process your message. Please try again.";
                    }
                    return c.json({ reply });
                },
            }),
        ],
    },
    inngest: { serve: inngestServe },
    mcpServers: {
        allTools: new MCPServer({ name: "allTools", version: "1.0.0", tools: {} }),
    },
};
export const mastra = new Mastra(mastraConfig);
// Telegram integration
try {
    registerTelegramTrigger(mastra);
}
catch (e) {
    logger.warn("Telegram trigger failed", e);
}
// Enforce single agent
if (Object.keys(mastra.getAgents()).length > 1) {
    throw new Error("Only 1 agent allowed");
}
logger.info(`Mastra server initialized on port ${APP_PORT}`);
export default mastra;

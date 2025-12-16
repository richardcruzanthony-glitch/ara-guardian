// IRON MODE — TELEMETRY DEAD FOREVER
process.env.MASTRA_TELEMETRY_ENABLED = "false";
import { Mastra } from "@mastra/core";
import { MCPServer } from "@mastra/mcp";
import { brainEngine } from "./tools/brainEngine.js";
// @ts-ignore: Accept any type for getOpenRouterCompletion input
import { exampleAgent } from "./agents/exampleAgent.js";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing.js";
import { grokReasoning } from "./tools/grokReasoning.js";
import { gpt4o } from "./tools/gpt4o.js";
import { scraper } from "./tools/scraper.js";
import { skillInstaller } from "./tools/skillInstaller.js";
import { adjuster } from "./tools/adjuster.js";
import { inngestServe } from "./inngest/index.js";
import { registerTelegramTrigger } from "../triggers/telegramTriggers.js";
import { registerApiRoute } from "@mastra/core/server";
// Secret API key
const AI_API_KEY = process.env.OPENROUTER_API_KEY || "";
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
    agents: { exampleAgent },
    server: {
        host: "0.0.0.0",
        port: Number(process.env.PORT) || 5000,
        apiRoutes: [
            // HTML Chat Frontend
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
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer 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'
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
                // middleware: [
                //   async (c, next) => {
                //     const token = c.req.header("Authorization");
                //     if (!token || token !== `Bearer ${AI_API_KEY}`) {
                //       return c.json({ error: "Unauthorized" }, 401);
                //     }
                //     await next();
                //   },
                // ],
                handler: async (c) => {
                    const { message } = await c.req.json();
                    if (!message || !message.trim()) {
                        return c.json({ error: "Message must be a non-empty string" }, 400);
                    }
                    const userMessage = message;
                    const agents = mastra.getAgents();
                    const agentNames = Object.keys(agents);
                    if (agentNames.length === 0)
                        return c.json({ error: "No agent found" }, 500);
                    const agent = agents[agentNames[0]];
                    let reply;
                    try {
                        // Basic command parser for /learn skill and other commands
                        if (userMessage.startsWith('/learn ')) {
                            // Format: /learn skill <name> <code>
                            const parts = userMessage.split(' ');
                            if (parts.length >= 4 && parts[1] === 'skill') {
                                const skill_name = parts[2];
                                const code = userMessage.substring(userMessage.indexOf(skill_name) + skill_name.length + 1);
                                const result = await agent.tools.skillInstaller.execute({ skill_name, code });
                                reply = `Skill installed: ${result}`;
                            }
                            else {
                                reply = 'Usage: /learn skill <name> <code>';
                            }
                        }
                        else {
                            // Route all other messages through the agent (tools, memory, etc.)
                            const response = await agent.generate({ input: userMessage });
                            reply = response?.output || 'No response';
                        }
                    }
                    catch (e) {
                        console.error('Agent processing failed:', e);
                        if (e instanceof Error) {
                            reply = `ARA could not process your message. Error: ${e.message}\nStack: ${e.stack}`;
                        }
                        else {
                            reply = `ARA could not process your message. Unknown error: ${JSON.stringify(e)}`;
                        }
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
    console.warn("Telegram trigger failed:", e);
}
// Enforce single agent
if (Object.keys(mastra.getAgents()).length > 1) {
    throw new Error("Only 1 agent allowed");
}
export default mastra;

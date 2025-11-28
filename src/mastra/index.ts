import { Mastra } from "@mastra/core";
import { MastraError } from "@mastra/core/error";
import { PinoLogger } from "@mastra/loggers";
import { LogLevel, MastraLogger } from "@mastra/core/logger";
import pino from "pino";
import { MCPServer } from "@mastra/mcp";
import { NonRetriableError } from "inngest";
import { z } from "zod";

import { sharedPostgresStorage } from "./storage";
import { inngest, inngestServe } from "./inngest";

import { registerTelegramTrigger } from "../triggers/telegramTriggers";
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";

class ProductionPinoLogger extends MastraLogger {
  protected logger: pino.Logger;

  constructor(
    options: {
      name?: string;
      level?: LogLevel;
    } = {},
  ) {
    super(options);

    this.logger = pino({
      name: options.name || "app",
      level: options.level || LogLevel.INFO,
      base: {},
      formatters: {
        level: (label: string, _number: number) => ({
          level: label,
        }),
      },
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    });
  }

  debug(message: string, args: Record<string, any> = {}): void {
    this.logger.debug(args, message);
  }

  info(message: string, args: Record<string, any> = {}): void {
    this.logger.info(args, message);
  }

  warn(message: string, args: Record<string, any> = {}): void {
    this.logger.warn(args, message);
  }

  error(message: string, args: Record<string, any> = {}): void {
    this.logger.error(args, message);
  }
}

export const mastra = new Mastra({
  storage: sharedPostgresStorage,
  workflows: { araBrainWorkflow },
  agents: {},
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {},
    }),
  },
  bundler: {
    externals: [
      "@slack/web-api",
      "inngest",
      "inngest/hono",
      "hono",
      "hono/streaming",
    ],
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    middleware: [
      async (c, next) => {
        const mastra = c.get("mastra");
        const logger = mastra?.getLogger();
        logger?.debug("[Request]", { method: c.req.method, url: c.req.url });
        try {
          await next();
        } catch (error) {
          logger?.error("[Response]", {
            method: c.req.method,
            url: c.req.url,
            error,
          });
          if (error instanceof MastraError) {
            if (error.id === "AGENT_MEMORY_MISSING_RESOURCE_ID") {
              throw new NonRetriableError(error.message, { cause: error });
            }
          } else if (error instanceof z.ZodError) {
            throw new NonRetriableError(error.message, { cause: error });
          }

          throw error;
        }
      },
    ],
    apiRoutes: [
      {
        path: "/",
        method: "GET",
        handler: async (c) => {
          const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ara-Brain Chat</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    h1 { color: #a855f7; margin-bottom: 10px; }
    .subtitle { color: #888; margin-bottom: 30px; font-size: 14px; }
    .chat-container { width: 100%; max-width: 500px; background: #16213e; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .messages { height: 400px; overflow-y: auto; margin-bottom: 20px; padding: 10px; background: #0f0f23; border-radius: 12px; }
    .message { padding: 12px 16px; margin: 8px 0; border-radius: 12px; max-width: 85%; word-wrap: break-word; }
    .user { background: #a855f7; margin-left: auto; text-align: right; }
    .bot { background: #2d3748; }
    .input-area { display: flex; gap: 10px; }
    input { flex: 1; padding: 14px 18px; border: none; border-radius: 12px; background: #0f0f23; color: #eee; font-size: 16px; outline: none; }
    input:focus { box-shadow: 0 0 0 2px #a855f7; }
    button { padding: 14px 24px; background: #a855f7; color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background 0.2s; }
    button:hover { background: #9333ea; }
    button:disabled { background: #555; cursor: not-allowed; }
    .typing { color: #888; font-style: italic; padding: 8px; }
  </style>
</head>
<body>
  <h1>Ara-Brain</h1>
  <p class="subtitle">Simple text matching bot - no AI</p>
  <div class="chat-container">
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <input type="text" id="input" placeholder="Type a message..." onkeypress="if(event.key==='Enter')sendMessage()">
      <button onclick="sendMessage()" id="sendBtn">Send</button>
    </div>
  </div>
  <script>
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');
    
    function addMessage(text, isUser) {
      const div = document.createElement('div');
      div.className = 'message ' + (isUser ? 'user' : 'bot');
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
    
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      
      addMessage(text, true);
      input.value = '';
      sendBtn.disabled = true;
      
      const typing = document.createElement('div');
      typing.className = 'typing';
      typing.textContent = 'Thinking...';
      messages.appendChild(typing);
      
      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        typing.remove();
        addMessage(data.response, false);
      } catch (err) {
        typing.remove();
        addMessage('Error: ' + err.message, false);
      }
      sendBtn.disabled = false;
      input.focus();
    }
    
    input.focus();
  </script>
</body>
</html>`;
          return c.html(html);
        },
      },
      {
        path: "/chat",
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
          try {
            const { message } = await c.req.json();
            logger?.info("💬 [Chat] Received message:", { message });
            
            const searchLower = message.toLowerCase().trim();
            const memoryLines = [
              "hello there, how are you doing today?",
              "what's up brother, nice to hear from you",
              "good morning sunshine, hope you slept well",
              "i love you more than words can say",
              "remember that time we stayed up all night talking?",
              "you always know how to make me smile",
              "can't wait to see you again soon",
              "thinking about you right now",
              "you're my favorite person in the world",
              "let's grab coffee sometime this week",
              "missing our late night conversations",
              "you make everything better just by being here",
              "thanks for always being there for me",
              "you're the best thing that ever happened to me",
              "hope your day is as amazing as you are"
            ];
            
            const match = memoryLines.find((line) => line.includes(searchLower));
            const response = match || "got it. what now, brother?";
            
            logger?.info("✅ [Chat] Response:", { response, foundMatch: !!match });
            return c.json({ response, foundMatch: !!match });
          } catch (error) {
            logger?.error("❌ [Chat] Error:", { error });
            return c.json({ response: "Error processing message", foundMatch: false }, 500);
          }
        },
      },
      {
        path: "/api/inngest",
        method: "ALL",
        createHandler: async ({ mastra }) => inngestServe({ mastra, inngest }),
      },
      ...registerTelegramTrigger({
        triggerType: "telegram/message",
        handler: async (mastra, triggerInfo) => {
          const logger = mastra.getLogger();
          logger?.info("📨 [Telegram Trigger] Received message:", {
            userName: triggerInfo.params.userName,
            message: triggerInfo.params.message,
          });

          const chatId = triggerInfo.payload.message.chat.id;
          
          logger?.info("🚀 [Telegram Trigger] Starting workflow:", {
            chatId,
            message: triggerInfo.params.message,
          });

          const run = await araBrainWorkflow.createRunAsync();
          const result = await run.start({
            inputData: {
              message: triggerInfo.params.message,
              chatId: chatId,
            },
          });

          logger?.info("✅ [Telegram Trigger] Workflow completed:", { result });
        },
      }),
    ],
  },
  logger:
    process.env.NODE_ENV === "production"
      ? new ProductionPinoLogger({
          name: "Mastra",
          level: "info",
        })
      : new PinoLogger({
          name: "Mastra",
          level: "info",
        }),
});

if (Object.keys(mastra.getWorkflows()).length > 1) {
  throw new Error(
    "More than 1 workflows found. Currently, more than 1 workflows are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}

if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error(
    "More than 1 agents found. Currently, more than 1 agents are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}

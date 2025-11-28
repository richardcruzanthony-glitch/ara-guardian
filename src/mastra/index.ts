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

// Shared memory storage (in-memory for now)
let memoryPhrases: string[] = [
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

export function getMemoryPhrases() { return memoryPhrases; }
export function addMemoryPhrase(phrase: string) { memoryPhrases.push(phrase.toLowerCase()); }
export function deleteMemoryPhrase(index: number) { memoryPhrases.splice(index, 1); }

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
  <title>Ara-Brain</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    h1 { color: #a855f7; margin-bottom: 5px; }
    .subtitle { color: #888; margin-bottom: 20px; font-size: 14px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .tab { padding: 12px 24px; background: #2d3748; color: #eee; border: none; border-radius: 12px 12px 0 0; cursor: pointer; font-size: 15px; font-weight: 500; transition: all 0.2s; }
    .tab:hover { background: #3d4758; }
    .tab.active { background: #16213e; color: #a855f7; }
    .container { width: 100%; max-width: 600px; background: #16213e; border-radius: 0 16px 16px 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); min-height: 500px; }
    .panel { display: none; }
    .panel.active { display: block; }
    .controls { display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; }
    .control-btn { padding: 8px 16px; background: #2d3748; color: #eee; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .control-btn:hover { background: #3d4758; }
    .control-btn.muted { background: #dc2626; }
    .messages { height: 320px; overflow-y: auto; margin-bottom: 15px; padding: 10px; background: #0f0f23; border-radius: 12px; }
    .message { padding: 10px 14px; margin: 6px 0; border-radius: 12px; max-width: 85%; word-wrap: break-word; font-size: 15px; }
    .user { background: #a855f7; margin-left: auto; text-align: right; }
    .bot { background: #2d3748; }
    .input-area { display: flex; gap: 8px; }
    input, textarea { flex: 1; padding: 12px 16px; border: none; border-radius: 12px; background: #0f0f23; color: #eee; font-size: 15px; outline: none; font-family: inherit; }
    input:focus, textarea:focus { box-shadow: 0 0 0 2px #a855f7; }
    button { padding: 12px 18px; background: #a855f7; color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 600; transition: background 0.2s; }
    button:hover { background: #9333ea; }
    button:disabled { background: #555; cursor: not-allowed; }
    .mic-btn { background: #22c55e; min-width: 48px; padding: 12px; }
    .mic-btn:hover { background: #16a34a; }
    .mic-btn.listening { background: #dc2626; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .typing { color: #888; font-style: italic; padding: 8px; }
    .status { text-align: center; color: #888; font-size: 12px; margin-top: 10px; min-height: 18px; }
    .memory-list { background: #0f0f23; border-radius: 12px; padding: 15px; max-height: 350px; overflow-y: auto; margin-bottom: 15px; }
    .memory-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #2d3748; border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
    .memory-item:last-child { margin-bottom: 0; }
    .memory-text { flex: 1; }
    .delete-btn { background: #dc2626; padding: 6px 12px; font-size: 12px; border-radius: 6px; }
    .delete-btn:hover { background: #b91c1c; }
    .add-area { display: flex; gap: 10px; }
    .add-area input { flex: 1; }
    .add-btn { background: #22c55e; }
    .add-btn:hover { background: #16a34a; }
    .info { background: #1e3a5f; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; color: #93c5fd; }
    .count { color: #888; font-size: 13px; margin-bottom: 10px; }
    .tool-section { background: #0f0f23; border-radius: 12px; padding: 15px; margin-bottom: 15px; }
    .tool-title { color: #a855f7; font-size: 16px; margin-bottom: 10px; }
    .tool-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .tool-row input { flex: 1; }
    .tool-output { background: #2d3748; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; min-height: 40px; word-break: break-all; }
    .tool-output:empty::before { content: 'Result will appear here...'; color: #666; }
    .pattern-item { padding: 6px 0; border-bottom: 1px solid #3d4758; }
    .pattern-item:last-child { border-bottom: none; }
    .pattern-label { color: #a855f7; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Ara-Brain</h1>
  <p class="subtitle">Voice-enabled memory bot</p>
  
  <div class="tabs">
    <button class="tab active" onclick="showTab('chat')">Chat</button>
    <button class="tab" onclick="showTab('tools')">Tools</button>
    <button class="tab" onclick="showTab('resources')">Resources</button>
  </div>
  
  <div class="container">
    <div id="chatPanel" class="panel active">
      <div class="controls">
        <button class="control-btn" id="muteBtn" onclick="toggleMute()">
          <span id="muteIcon">🔊</span> <span id="muteText">Sound On</span>
        </button>
      </div>
      <div class="messages" id="messages"></div>
      <div class="input-area">
        <button class="mic-btn" id="micBtn" onclick="toggleListening()">🎤</button>
        <input type="text" id="input" placeholder="Type or speak..." onkeypress="if(event.key==='Enter')sendMessage()">
        <button onclick="sendMessage()" id="sendBtn">Send</button>
      </div>
      <div class="status" id="status"></div>
    </div>
    
    <div id="toolsPanel" class="panel">
      <div class="tool-section">
        <h3 class="tool-title">Encryption</h3>
        <div class="info">Encode any text with a numeric key - works on all characters</div>
        <div class="tool-row">
          <input type="text" id="encryptInput" placeholder="Message to encrypt...">
          <input type="number" id="encryptKey" placeholder="Key" value="7" style="width:80px;">
          <button onclick="encryptText()">Encrypt</button>
        </div>
        <div class="tool-output" id="encryptOutput"></div>
      </div>
      
      <div class="tool-section">
        <h3 class="tool-title">Decryption</h3>
        <div class="info">Decode an encrypted message with the same key</div>
        <div class="tool-row">
          <input type="text" id="decryptInput" placeholder="Encrypted message...">
          <input type="number" id="decryptKey" placeholder="Key" value="7" style="width:80px;">
          <button onclick="decryptText()">Decrypt</button>
        </div>
        <div class="tool-output" id="decryptOutput"></div>
      </div>
      
      <div class="tool-section">
        <h3 class="tool-title">Pattern Recognition</h3>
        <div class="info">Analyze text to detect patterns, emails, numbers, repeated words</div>
        <div class="tool-row">
          <input type="text" id="patternInput" placeholder="Text to analyze...">
          <button onclick="analyzePattern()">Analyze</button>
        </div>
        <div class="tool-output" id="patternOutput"></div>
      </div>
    </div>
    
    <div id="resourcesPanel" class="panel">
      <div class="info">These are the phrases Ara-Brain knows. When you send a message containing any word from a phrase, it responds with that phrase.</div>
      <div class="count" id="memoryCount"></div>
      <div class="memory-list" id="memoryList"></div>
      <div class="add-area">
        <input type="text" id="newPhrase" placeholder="Add a new phrase..." onkeypress="if(event.key==='Enter')addPhrase()">
        <button class="add-btn" onclick="addPhrase()">Add</button>
      </div>
    </div>
  </div>
  
  <script>
    let memoryLines = [];
    let isMuted = false;
    let isListening = false;
    let recognition = null;
    
    async function loadMemory() {
      const res = await fetch('/memory');
      const data = await res.json();
      memoryLines = data.phrases;
      renderMemory();
    }
    
    function renderMemory() {
      const list = document.getElementById('memoryList');
      const count = document.getElementById('memoryCount');
      count.textContent = memoryLines.length + ' phrases in memory';
      list.innerHTML = memoryLines.map((phrase, i) => 
        '<div class="memory-item"><span class="memory-text">' + phrase + '</span><button class="delete-btn" onclick="deletePhrase(' + i + ')">Delete</button></div>'
      ).join('');
    }
    
    async function addPhrase() {
      const input = document.getElementById('newPhrase');
      const phrase = input.value.trim();
      if (!phrase) return;
      await fetch('/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', phrase })
      });
      input.value = '';
      loadMemory();
    }
    
    async function deletePhrase(index) {
      await fetch('/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', index })
      });
      loadMemory();
    }
    
    function showTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelector('.tab[onclick*="' + tab + '"]').classList.add('active');
      document.getElementById(tab + 'Panel').classList.add('active');
      if (tab === 'resources') loadMemory();
    }
    
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('micBtn');
    const status = document.getElementById('status');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onstart = () => { isListening = true; micBtn.classList.add('listening'); status.textContent = 'Listening...'; };
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
        input.value = transcript;
        if (event.results[event.results.length - 1].isFinal) { status.textContent = 'Got it!'; setTimeout(() => sendMessage(), 300); }
      };
      recognition.onerror = (event) => { status.textContent = 'Error: ' + event.error; stopListening(); };
      recognition.onend = () => stopListening();
    } else { micBtn.style.display = 'none'; }
    
    function toggleListening() { if (!recognition) return; isListening ? recognition.stop() : recognition.start(); }
    function stopListening() { isListening = false; micBtn.classList.remove('listening'); setTimeout(() => { if (!isListening) status.textContent = ''; }, 2000); }
    function toggleMute() {
      isMuted = !isMuted;
      document.getElementById('muteIcon').textContent = isMuted ? '🔇' : '🔊';
      document.getElementById('muteText').textContent = isMuted ? 'Sound Off' : 'Sound On';
      document.getElementById('muteBtn').classList.toggle('muted', isMuted);
      if (isMuted) window.speechSynthesis.cancel();
    }
    function speak(text) { if (isMuted || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1; u.pitch = 1; window.speechSynthesis.speak(u); }
    function addMessage(text, isUser) { const div = document.createElement('div'); div.className = 'message ' + (isUser ? 'user' : 'bot'); div.textContent = text; messages.appendChild(div); messages.scrollTop = messages.scrollHeight; }
    
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, true);
      input.value = '';
      sendBtn.disabled = true;
      micBtn.disabled = true;
      const typing = document.createElement('div');
      typing.className = 'typing';
      typing.textContent = 'Thinking...';
      messages.appendChild(typing);
      try {
        const res = await fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
        const data = await res.json();
        typing.remove();
        addMessage(data.response, false);
        speak(data.response);
      } catch (err) { typing.remove(); addMessage('Error: ' + err.message, false); }
      sendBtn.disabled = false;
      micBtn.disabled = false;
      input.focus();
    }
    
    async function encryptText() {
      const text = document.getElementById('encryptInput').value;
      const key = parseInt(document.getElementById('encryptKey').value) || 3;
      if (!text) return;
      const res = await fetch('/tools/encrypt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, key }) });
      const data = await res.json();
      document.getElementById('encryptOutput').textContent = data.result;
    }
    
    async function decryptText() {
      const text = document.getElementById('decryptInput').value;
      const key = parseInt(document.getElementById('decryptKey').value) || 3;
      if (!text) return;
      const res = await fetch('/tools/decrypt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, key }) });
      const data = await res.json();
      document.getElementById('decryptOutput').textContent = data.result;
    }
    
    async function analyzePattern() {
      const text = document.getElementById('patternInput').value;
      if (!text) return;
      const res = await fetch('/tools/pattern', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await res.json();
      const output = document.getElementById('patternOutput');
      output.innerHTML = data.patterns.map(p => '<div class="pattern-item"><span class="pattern-label">' + p.type + ':</span> ' + p.value + '</div>').join('');
    }
    
    input.focus();
    loadMemory();
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
            const match = memoryPhrases.find((line) => line.includes(searchLower));
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
        path: "/memory",
        method: "GET",
        handler: async (c) => {
          return c.json({ phrases: memoryPhrases });
        },
      },
      {
        path: "/memory",
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
          try {
            const { action, phrase, index } = await c.req.json();
            if (action === 'add' && phrase) {
              addMemoryPhrase(phrase);
              logger?.info("➕ [Memory] Added phrase:", { phrase });
            } else if (action === 'delete' && typeof index === 'number') {
              const deleted = memoryPhrases[index];
              deleteMemoryPhrase(index);
              logger?.info("🗑️ [Memory] Deleted phrase:", { deleted });
            }
            return c.json({ success: true, phrases: memoryPhrases });
          } catch (error) {
            logger?.error("❌ [Memory] Error:", { error });
            return c.json({ success: false }, 500);
          }
        },
      },
      {
        path: "/tools/encrypt",
        method: "POST",
        handler: async (c) => {
          const { text, key } = await c.req.json();
          const shift = Math.abs(parseInt(key)) || 3;
          const result = text.split('').map((char: string) => {
            const code = char.charCodeAt(0);
            return String.fromCharCode((code + shift) % 65536);
          }).join('');
          return c.json({ result });
        },
      },
      {
        path: "/tools/decrypt",
        method: "POST",
        handler: async (c) => {
          const { text, key } = await c.req.json();
          const shift = Math.abs(parseInt(key)) || 3;
          const result = text.split('').map((char: string) => {
            const code = char.charCodeAt(0);
            return String.fromCharCode((code - shift + 65536) % 65536);
          }).join('');
          return c.json({ result });
        },
      },
      {
        path: "/tools/pattern",
        method: "POST",
        handler: async (c) => {
          const { text } = await c.req.json();
          const patterns: { type: string; value: string }[] = [];
          
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.][a-zA-Z]{2,}/g;
          const emails = text.match(emailRegex);
          if (emails) patterns.push({ type: 'Emails', value: emails.join(', ') });
          
          const phoneRegex = /[+]?[0-9][0-9 ()\-.]{9,}/g;
          const phones = text.match(phoneRegex);
          if (phones) patterns.push({ type: 'Phone Numbers', value: phones.map((p: string) => p.trim()).join(', ') });
          
          const urlRegex = /https?:[/][/][^ ]+/g;
          const urls = text.match(urlRegex);
          if (urls) patterns.push({ type: 'URLs', value: urls.join(', ') });
          
          const numberRegex = /[0-9]+/g;
          const numbers = text.match(numberRegex);
          if (numbers) patterns.push({ type: 'Numbers', value: numbers.join(', ') });
          
          const wordRegex = /[a-z]+/gi;
          const words = text.toLowerCase().match(wordRegex) || [];
          const wordCount: { [key: string]: number } = {};
          words.forEach((w: string) => { wordCount[w] = (wordCount[w] || 0) + 1; });
          const repeated = Object.entries(wordCount).filter(([_, c]) => c > 1).map(([w, c]) => w + ' (x' + c + ')');
          if (repeated.length) patterns.push({ type: 'Repeated Words', value: repeated.join(', ') });
          
          patterns.push({ type: 'Length', value: text.length + ' characters, ' + words.length + ' words' });
          
          const upper = (text.match(/[A-Z]/g) || []).length;
          const pct = text.length > 0 ? Math.round(upper/text.length*100) : 0;
          patterns.push({ type: 'Uppercase', value: upper + ' uppercase letters (' + pct + '%)' });
          
          if (patterns.length === 2) patterns.unshift({ type: 'Patterns', value: 'No special patterns detected' });
          
          return c.json({ patterns });
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

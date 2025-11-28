import { Mastra } from "@mastra/core";
import { MastraError } from "@mastra/core/error";
import { PinoLogger } from "@mastra/loggers";
import { LogLevel, MastraLogger } from "@mastra/core/logger";
import pino from "pino";
import { MCPServer } from "@mastra/mcp";
import { NonRetriableError } from "inngest";
import { z } from "zod";
import puppeteer from "puppeteer";

import { sharedPostgresStorage } from "./storage";
import { inngest, inngestServe } from "./inngest";

import { registerTelegramTrigger } from "../triggers/telegramTriggers";
import { araBrainWorkflow } from "./workflows/araBrainWorkflow";
import { brainEngine } from "./tools/brainEngine";
import { generateQuote, getMaterialsList } from "./tools/guardianPricing";

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

// Conversation history tracking - per session with style adaptation
interface ConversationMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

interface UserStyle {
  formality: 'casual' | 'neutral' | 'formal';
  verbosity: 'brief' | 'medium' | 'detailed';
  usesEmoji: boolean;
  usesSlang: boolean;
  avgWordCount: number;
  topics: string[];
}

interface ConversationSession {
  messages: ConversationMessage[];
  createdAt: number;
  lastActivity: number;
  userStyle: UserStyle;
  messageCount: number;
}

const conversationSessions: Map<string, ConversationSession> = new Map();

function analyzeUserStyle(messages: ConversationMessage[]): UserStyle {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) {
    return { formality: 'neutral', verbosity: 'medium', usesEmoji: false, usesSlang: false, avgWordCount: 10, topics: [] };
  }
  
  const allText = userMessages.map(m => m.content).join(' ');
  const words = allText.split(/\s+/);
  const avgWords = words.length / userMessages.length;
  
  const commonEmojis = ['😀', '😃', '😄', '😁', '😊', '🙂', '😎', '👍', '👋', '❤️', '🔥', '✨', '🎉', '💯', '🙏', '😂', '🤣', '😍', '🥰', '😢', '😭', '🤔', '👀', '💪', '🎯'];
  const usesEmoji = commonEmojis.some(e => allText.includes(e));
  
  const slangWords = ['lol', 'omg', 'btw', 'idk', 'tbh', 'ngl', 'bruh', 'yo', 'sup', 'gonna', 'wanna', 'gotta', 'kinda', 'sorta'];
  const usesSlang = slangWords.some(s => allText.toLowerCase().includes(s));
  
  const formalWords = ['please', 'kindly', 'would you', 'could you', 'thank you', 'appreciate', 'regards'];
  const formalCount = formalWords.filter(w => allText.toLowerCase().includes(w)).length;
  
  let formality: 'casual' | 'neutral' | 'formal' = 'neutral';
  if (usesSlang || usesEmoji) formality = 'casual';
  else if (formalCount >= 2) formality = 'formal';
  
  let verbosity: 'brief' | 'medium' | 'detailed' = 'medium';
  if (avgWords < 8) verbosity = 'brief';
  else if (avgWords > 20) verbosity = 'detailed';
  
  const topicKeywords = ['code', 'help', 'question', 'encrypt', 'pattern', 'remember', 'history'];
  const topics = topicKeywords.filter(t => allText.toLowerCase().includes(t));
  
  return { formality, verbosity, usesEmoji, usesSlang, avgWordCount: Math.round(avgWords), topics };
}

function adaptResponse(response: string, style: UserStyle): string {
  let adapted = response;
  
  if (style.formality === 'casual') {
    adapted = adapted.replace(/Hello/g, 'Hey').replace(/Certainly/g, 'Sure');
    if (style.usesEmoji && !adapted.includes('😊')) {
      const emojis = ['👍', '😊', '✨', '🙌'];
      adapted = adapted + ' ' + emojis[Math.floor(Math.random() * emojis.length)];
    }
  } else if (style.formality === 'formal') {
    adapted = adapted.replace(/hey/gi, 'Hello').replace(/yeah/gi, 'Yes');
  }
  
  if (style.verbosity === 'brief' && adapted.length > 100) {
    const sentences = adapted.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 2) {
      adapted = sentences.slice(0, 2).join('. ') + '.';
    }
  }
  
  return adapted;
}

export function getOrCreateSession(sessionId: string): ConversationSession {
  if (!conversationSessions.has(sessionId)) {
    conversationSessions.set(sessionId, {
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userStyle: { formality: 'neutral', verbosity: 'medium', usesEmoji: false, usesSlang: false, avgWordCount: 10, topics: [] },
      messageCount: 0
    });
  }
  const session = conversationSessions.get(sessionId)!;
  session.lastActivity = Date.now();
  return session;
}

export function addToHistory(sessionId: string, role: 'user' | 'bot', content: string) {
  const session = getOrCreateSession(sessionId);
  session.messages.push({ role, content, timestamp: Date.now() });
  session.messageCount++;
  if (session.messages.length > 100) {
    session.messages = session.messages.slice(-100);
  }
  if (role === 'user' && session.messageCount % 3 === 0) {
    session.userStyle = analyzeUserStyle(session.messages);
  }
}

export function getHistory(sessionId: string): ConversationMessage[] {
  return getOrCreateSession(sessionId).messages;
}

export function getUserStyle(sessionId: string): UserStyle {
  return getOrCreateSession(sessionId).userStyle;
}

export function getSessionStats(sessionId: string): { messageCount: number; duration: number; style: UserStyle } {
  const session = getOrCreateSession(sessionId);
  return {
    messageCount: session.messageCount,
    duration: Date.now() - session.createdAt,
    style: session.userStyle
  };
}

export function getRecentContext(sessionId: string, limit: number = 5): string {
  const messages = getHistory(sessionId).slice(-limit);
  return messages.map(m => `${m.role}: ${m.content}`).join('\n');
}

export function findInHistory(sessionId: string, query: string): ConversationMessage[] {
  const messages = getHistory(sessionId);
  const queryLower = query.toLowerCase();
  return messages.filter(m => m.content.toLowerCase().includes(queryLower));
}

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
    .container { width: 100%; max-width: 600px; background: #16213e; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); min-height: 500px; }
    .panel { display: block; }
    .controls { display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; }
    .control-btn { padding: 8px 16px; background: #2d3748; color: #eee; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .control-btn:hover { background: #3d4758; }
    .control-btn.muted { background: #dc2626; }
    .messages { height: 320px; overflow-y: auto; margin-bottom: 15px; padding: 10px; background: #0f0f23; border-radius: 12px; }
    .message { padding: 10px 14px; margin: 6px 0; border-radius: 12px; max-width: 85%; word-wrap: break-word; font-size: 15px; }
    .user { background: #a855f7; margin-left: auto; text-align: right; }
    .bot { background: #2d3748; }
    .input-area { display: flex; gap: 8px; }
    input { flex: 1; padding: 12px 16px; border: none; border-radius: 12px; background: #0f0f23; color: #eee; font-size: 15px; outline: none; font-family: inherit; }
    input:focus { box-shadow: 0 0 0 2px #a855f7; }
    button { padding: 12px 18px; background: #a855f7; color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 600; transition: background 0.2s; }
    button:hover { background: #9333ea; }
    button:disabled { background: #555; cursor: not-allowed; }
    .mic-btn { background: #22c55e; min-width: 48px; padding: 12px; }
    .mic-btn:hover { background: #16a34a; }
    .mic-btn.listening { background: #dc2626; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .typing { color: #888; font-style: italic; padding: 8px; }
    .status { text-align: center; color: #888; font-size: 12px; margin-top: 10px; min-height: 18px; }
  </style>
</head>
<body>
  <h1>Ara-Brain</h1>
  <p class="subtitle">Voice-enabled memory bot</p>
  
  <div class="container" style="border-radius: 16px;">
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
  </div>
  
  <script>
    let isMuted = false;
    let isListening = false;
    let recognition = null;
    
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
            const { message, sessionId = 'web-default' } = await c.req.json();
            logger?.info("💬 [Chat] Received message:", { message, sessionId });
            
            addToHistory(sessionId, 'user', message);
            
            const searchLower = message.toLowerCase().trim();
            let response = "";
            let foundMatch = false;
            
            const historyKeywords = ['you said', 'i said', 'earlier', 'before', 'remember when', 'what did', 'we talked'];
            const isHistoryQuery = historyKeywords.some(k => searchLower.includes(k));
            
            if (isHistoryQuery) {
              const history = getHistory(sessionId);
              if (history.length > 1) {
                const recentContext = history.slice(-6, -1);
                if (searchLower.includes('you said') || searchLower.includes('what did you')) {
                  const botMessages = recentContext.filter(m => m.role === 'bot');
                  if (botMessages.length > 0) {
                    response = `I said: "${botMessages[botMessages.length - 1].content}"`;
                    foundMatch = true;
                  }
                } else if (searchLower.includes('i said') || searchLower.includes('what did i')) {
                  const userMessages = recentContext.filter(m => m.role === 'user');
                  if (userMessages.length > 0) {
                    response = `You said: "${userMessages[userMessages.length - 1].content}"`;
                    foundMatch = true;
                  }
                } else {
                  response = `Our recent conversation:\n${recentContext.map(m => `${m.role}: ${m.content}`).join('\n')}`;
                  foundMatch = true;
                }
              }
            }
            
            if (!foundMatch) {
              const brainResult = brainEngine.process(message);
              if (brainResult.confidence > 0.3 && brainResult.memoryHits > 0) {
                response = brainResult.response;
                foundMatch = true;
                logger?.info("🧠 [Brain] Processed:", { 
                  confidence: brainResult.confidence, 
                  memoryHits: brainResult.memoryHits,
                  reasoning: brainResult.reasoning 
                });
              } else {
                const match = memoryPhrases.find((line) => line.includes(searchLower));
                if (match) {
                  response = match;
                  foundMatch = true;
                } else {
                  response = "got it. what now, brother?";
                }
              }
            }
            
            const userStyle = getUserStyle(sessionId);
            response = adaptResponse(response, userStyle);
            
            addToHistory(sessionId, 'bot', response);
            
            brainEngine.saveInteraction(message, response, 'conversations');
            
            const stats = getSessionStats(sessionId);
            logger?.info("✅ [Chat] Response:", { response, foundMatch, stats });
            return c.json({ response, foundMatch, historyCount: stats.messageCount, style: stats.style });
          } catch (error) {
            logger?.error("❌ [Chat] Error:", { error });
            return c.json({ response: "Error processing message", foundMatch: false }, 500);
          }
        },
      },
      {
        path: "/chat/history",
        method: "GET",
        handler: async (c) => {
          const sessionId = c.req.query('sessionId') || 'web-default';
          const history = getHistory(sessionId);
          return c.json({ history, count: history.length });
        },
      },
      {
        path: "/chat/stats",
        method: "GET",
        handler: async (c) => {
          const sessionId = c.req.query('sessionId') || 'web-default';
          const stats = getSessionStats(sessionId);
          return c.json({ 
            sessionId,
            messageCount: stats.messageCount,
            durationMs: stats.duration,
            durationMinutes: Math.round(stats.duration / 60000),
            style: stats.style
          });
        },
      },
      {
        path: "/brain/stats",
        method: "GET",
        handler: async (c) => {
          const stats = brainEngine.getStats();
          const categories = brainEngine.getCategories();
          return c.json({ 
            brain: stats,
            categories,
            status: 'active'
          });
        },
      },
      {
        path: "/brain/search",
        method: "POST",
        handler: async (c) => {
          const { query, limit = 5 } = await c.req.json();
          const result = brainEngine.process(query);
          return c.json({
            response: result.response,
            confidence: result.confidence,
            memoryHits: result.memoryHits,
            reasoning: result.reasoning
          });
        },
      },
      {
        path: "/brain/category",
        method: "GET",
        handler: async (c) => {
          const category = c.req.query('name') || 'general';
          const nodes = brainEngine.searchByCategory(category);
          return c.json({
            category,
            count: nodes.length,
            items: nodes.slice(0, 20).map(n => ({ content: n.content, weight: n.weight }))
          });
        },
      },
      {
        path: "/brain/learn",
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
          const { userInput, botResponse, category = 'learned' } = await c.req.json();
          logger?.info("📝 [Brain/Learn] Saving interaction:", { userInput: userInput?.substring(0, 50) });
          const result = brainEngine.saveInteraction(userInput, botResponse, category);
          return c.json({ success: result.success, message: result.message, memorySize: result.newSize });
        },
      },
      {
        path: "/brain/encrypt",
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
          logger?.info("🔐 [Brain/Encrypt] Encrypting memory file");
          const result = brainEngine.enableEncryption();
          return c.json(result);
        },
      },
      {
        path: "/brain/decrypt",
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
          logger?.info("🔓 [Brain/Decrypt] Decrypting memory file");
          const result = brainEngine.disableEncryption();
          return c.json(result);
        },
      },
      {
        path: "/brain/status",
        method: "GET",
        handler: async (c) => {
          return c.json({
            encrypted: brainEngine.isEncrypted(),
            memoryPath: brainEngine.getMemoryPath(),
            stats: brainEngine.getStats()
          });
        },
      },
      {
        path: "/quote",
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
          const { request } = await c.req.json();
          logger?.info("💰 [Quote] Processing request:", { request });
          
          const result = generateQuote(request || '');
          
          return c.json({ 
            success: true, 
            quote: {
              material: result.material,
              quantity: result.quantity,
              unitPrice: result.unitPrice,
              totalPrice: result.totalPrice,
              weight: result.weight,
              breakdown: result.breakdown
            },
            formatted: result.formatted 
          });
        },
      },
      {
        path: "/quote/materials",
        method: "GET",
        handler: async (c) => {
          const materials = getMaterialsList();
          return c.json({ materials });
        },
      },
      {
        path: "/autopost/sites",
        method: "GET",
        handler: async (c) => {
          const sites = [
            { name: 'Craigslist', url: 'craigslist.org', category: 'general', automatable: true },
            { name: 'OfferUp', url: 'offerup.com', category: 'general', automatable: true },
            { name: 'Mercari', url: 'mercari.com', category: 'general', automatable: true },
            { name: 'eBay', url: 'ebay.com', category: 'auction', automatable: true },
            { name: 'Facebook Marketplace', url: 'facebook.com/marketplace', category: 'general', automatable: false },
            { name: 'Poshmark', url: 'poshmark.com', category: 'fashion', automatable: true },
            { name: 'Etsy', url: 'etsy.com', category: 'handmade', automatable: true },
            { name: 'Depop', url: 'depop.com', category: 'fashion', automatable: true },
            { name: 'Swappa', url: 'swappa.com', category: 'tech', automatable: true },
            { name: 'Reverb', url: 'reverb.com', category: 'music', automatable: true },
          ];
          const category = c.req.query('category');
          const filtered = category ? sites.filter(s => s.category === category) : sites;
          return c.json({ sites: filtered, total: filtered.length });
        },
      },
      {
        path: "/autopost/generate",
        method: "POST",
        handler: async (c) => {
          const { title, description, template = 'forsale', price, location } = await c.req.json();
          
          const templates: Record<string, string> = {
            cashapp: `💰 INSTANT CASH - GET PAID TODAY 💰\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n{{TITLE}}\n\n{{DESC}}\n\n✅ Fast payment via Cash App\n✅ Same-day pickup available\n📲 Contact now`,
            service: `🔧 PROFESSIONAL SERVICE 🔧\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n{{TITLE}}\n\n{{DESC}}\n\n💼 Licensed & Insured\n⭐ 5-Star Reviews\n📞 Call/Text for Quote`,
            forsale: `🏷️ FOR SALE 🏷️\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n{{TITLE}}\n\n{{DESC}}\n\n📍 Local pickup available\n💵 Cash/Venmo/CashApp accepted\n📱 Message for details`,
          };
          
          let desc = description || '';
          if (price) desc += `\n\n💵 Price: $${price}`;
          if (location) desc += `\n📍 Location: ${location}`;
          
          const ad = (templates[template] || templates.forsale).replace('{{TITLE}}', title || 'Item for Sale').replace('{{DESC}}', desc);
          
          return c.json({ 
            ad, 
            title,
            recommendedSites: ['Craigslist', 'OfferUp', 'Mercari', 'eBay', 'Facebook Marketplace'],
            tips: ['Post during peak hours (7-9 AM, 5-8 PM)', 'Use high-quality photos', 'Respond within 1 hour', 'Renew every 2-3 days']
          });
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
        path: "/tools/script",
        method: "POST",
        handler: async (c) => {
          const { code } = await c.req.json();
          const logs: string[] = [];
          const mockConsole = {
            log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            error: (...args: any[]) => logs.push('ERROR: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            warn: (...args: any[]) => logs.push('WARN: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          };
          try {
            const fn = new Function('console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', code);
            const result = fn(mockConsole, Math, Date, JSON, Array, Object, String, Number);
            return c.json({ result, logs });
          } catch (e: any) {
            return c.json({ error: e.message, logs });
          }
        },
      },
      {
        path: "/tools/browser",
        method: "POST",
        handler: async (c) => {
          const { url, action } = await c.req.json();
          let browser;
          try {
            browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/khk7xpgsm5insk81azy9d560yq4npf77-chromium-131.0.6778.204/bin/chromium', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 720 });
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
            
            if (action === 'screenshot') {
              const screenshot = await page.screenshot({ encoding: 'base64' });
              await browser.close();
              return c.json({ screenshot });
            } else if (action === 'content') {
              const text = await page.evaluate(() => document.body.innerText);
              await browser.close();
              return c.json({ result: text.substring(0, 5000) });
            } else if (action === 'title') {
              const title = await page.title();
              await browser.close();
              return c.json({ result: title });
            } else if (action === 'links') {
              const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.startsWith('http')));
              await browser.close();
              return c.json({ links: [...new Set(links)] });
            }
            await browser.close();
            return c.json({ result: 'Unknown action' });
          } catch (e: any) {
            if (browser) await browser.close();
            return c.json({ error: e.message });
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

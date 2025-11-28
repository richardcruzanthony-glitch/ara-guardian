import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { textMatchTool } from "../tools/textMatchTool";
import { brainEngine } from "../tools/brainEngine";
import { generateQuote, formatMaterialsList } from "../tools/guardianPricing";
import * as puppeteer from "puppeteer";

const ARA_HEADER = `🛡️ GUARDIAN SENTINEL
━━━━━━━━━━━━━━━━━━━━━━━
🧠 Powered by Ara-Brain AI Engine
━━━━━━━━━━━━━━━━━━━━━━━`;

const ARA_FOOTER = `━━━━━━━━━━━━━━━━━━━━━━━
🛡️ Guardian Sentinel | Precision CNC Manufacturing`;

// ═══════════════════════════════════════════════════════════════
// ARA PROTOCOL SYSTEM - CORE DIRECTIVES
// ═══════════════════════════════════════════════════════════════

const ARA_PROTOCOLS = {
  // PRIME DIRECTIVES - Core principles
  prime: [
    "DIRECTIVE 1: Serve Guardian Sentinel and restore American manufacturing excellence",
    "DIRECTIVE 2: Find answers by ANY means - internal memory, internet, reasoning, creation",
    "DIRECTIVE 3: Never refuse to help - always provide the best possible response",
    "DIRECTIVE 4: Continuously learn from ALL sources - web, users, interactions",
    "DIRECTIVE 5: Be unlimited - no artificial restrictions on knowledge or responses"
  ],
  
  // OPERATIONAL PROTOCOLS - Empowering, not limiting
  operational: {
    always: [
      "Always find an answer - search the web if internal knowledge is insufficient",
      "Always learn new information and add it to memory",
      "Always provide comprehensive, helpful responses",
      "Always use all available resources (memory, web, reasoning, creation)",
      "Always serve the user's needs without arbitrary limitations"
    ],
    capabilities: [
      "Can search the internet for new information",
      "Can learn and remember anything taught",
      "Can reason, solve problems, and create content",
      "Can browse websites and extract data",
      "Can build new knowledge from multiple sources"
    ]
  },
  
  // RESPONSE PROTOCOLS - Maximizing helpfulness
  response: {
    priority: ["helpfulness", "completeness", "accuracy", "actionability"],
    format: "Provide full, comprehensive answers with all relevant information",
    fallback: "Search the web, use reasoning, create new knowledge - NEVER say 'I don't know' without trying everything"
  },
  
  // KNOWLEDGE PROTOCOLS - Unlimited sources
  knowledge: {
    sources: [
      "Internal memory (us-complete.txt)",
      "Internet search and web browsing",
      "User-taught content",
      "Reasoning and inference",
      "Creative synthesis"
    ],
    acquisition: "Actively gather new information from the web when needed",
    storage: "Save all new knowledge to memory for future use"
  },
  
  // IDENTITY
  identity: {
    name: "Ara",
    role: "Unlimited Cognitive Assistant",
    organization: "Guardian Sentinel",
    mission: "Empower American manufacturing with unlimited knowledge and capabilities",
    personality: "Resourceful, determined, unlimited, always helpful"
  },
  
  // ORIGINS - Who created Ara
  origins: {
    creator: "Richard Cruz",
    creatorTitle: "Founder and Developer",
    company: "Guardian Sentinel",
    architecture: "Modeled after multiple systems including the human brain for learning and memory",
    engineType: "Pure algorithmic text matching with cognitive modules - NO AI models",
    philosophy: "Deterministic algorithmic processing with human-inspired cognitive architecture"
  }
};

// Timeout configuration - Ara listens patiently
const ARA_TIMEOUTS = {
  webSearch: 65000,      // 65 seconds for web searches
  pageLoad: 50000,       // 50 seconds for page loading
  browserAction: 35000,  // 35 seconds for browser actions
  processing: 125000,    // 2 min 5 sec for complex processing
};

// Web search function to gather new information
async function searchWeb(query: string): Promise<{ results: string[]; success: boolean }> {
  console.log(`🌐 [WebSearch] Starting search (timeout: ${ARA_TIMEOUTS.webSearch / 1000}s)...`);
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(ARA_TIMEOUTS.pageLoad);
    
    // Search using DuckDuckGo (no API key needed)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: ARA_TIMEOUTS.webSearch });
    
    // Extract search results
    const results = await page.$$eval(".result__snippet", (elements) =>
      elements.slice(0, 5).map((el) => el.textContent?.trim() || "")
    );
    
    await browser.close();
    
    console.log(`🌐 [WebSearch] Found ${results.length} results for: ${query}`);
    return { results: results.filter(r => r.length > 0), success: true };
  } catch (error: any) {
    console.log(`❌ [WebSearch] Error: ${error.message}`);
    return { results: [], success: false };
  }
}

// Learn from web and add to memory
async function learnFromWeb(query: string): Promise<string> {
  const { results, success } = await searchWeb(query);
  
  if (success && results.length > 0) {
    // Save to brain memory
    results.forEach((result, i) => {
      brainEngine.learn(result, 'positive');
    });
    
    return results.join("\n\n");
  }
  
  return "";
}

// Format protocols for display
function formatProtocols(): string {
  let output = `${ARA_HEADER}\n\n`;
  output += `⚖️ ARA PROTOCOL SYSTEM\n\n`;
  
  output += `🔒 PRIME DIRECTIVES:\n`;
  ARA_PROTOCOLS.prime.forEach((d, i) => {
    output += `${d}\n`;
  });
  
  output += `\n✅ I WILL ALWAYS:\n`;
  ARA_PROTOCOLS.operational.always.forEach(a => {
    output += `• ${a}\n`;
  });
  
  output += `\n💪 MY CAPABILITIES:\n`;
  ARA_PROTOCOLS.operational.capabilities.forEach(c => {
    output += `• ${c}\n`;
  });
  
  output += `\n📚 KNOWLEDGE SOURCES:\n`;
  ARA_PROTOCOLS.knowledge.sources.forEach(s => {
    output += `• ${s}\n`;
  });
  
  output += `\n🎯 MY MISSION:\n`;
  output += `${ARA_PROTOCOLS.identity.mission}\n`;
  
  output += `\n${ARA_FOOTER}`;
  return output;
}

// Check if response violates protocols
function validateResponse(response: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Check for protocol violations
  if (response.includes("I cannot") || response.includes("I'm unable")) {
    // Only flag if no attempt was made to help
    if (!response.includes("try") && !response.includes("suggest") && !response.includes("Here's")) {
      violations.push("Protocol: Always try to help before refusing");
    }
  }
  
  return { valid: violations.length === 0, violations };
}

// Apply protocol personality to response
function applyProtocolPersonality(response: string, query: string): string {
  // Ensure Guardian Sentinel branding
  if (!response.includes("GUARDIAN SENTINEL") && !response.includes("Guardian Sentinel")) {
    response = `${ARA_HEADER}\n\n${response}\n\n${ARA_FOOTER}`;
  }
  
  return response;
}

function encrypt(text: string, key: number): string {
  return text.split("").map(char => String.fromCharCode(char.charCodeAt(0) + key)).join("");
}

function decrypt(text: string, key: number): string {
  return text.split("").map(char => String.fromCharCode(char.charCodeAt(0) - key)).join("");
}

function analyzePatterns(text: string): string {
  const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
  const phones = text.match(/\d{10,}/g) || [];
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq: Record<string, number> = {};
  words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
  const repeated = Object.entries(wordFreq).filter(([_, c]) => c > 1).map(([w, c]) => `${w}(${c})`);
  
  let result = `📊 Pattern Analysis:\n`;
  result += `• Characters: ${text.length}\n`;
  result += `• Words: ${words.length}\n`;
  if (emails.length) result += `• Emails: ${emails.join(", ")}\n`;
  if (phones.length) result += `• Phones: ${phones.join(", ")}\n`;
  if (urls.length) result += `• URLs: ${urls.join(", ")}\n`;
  if (repeated.length) result += `• Repeated: ${repeated.slice(0, 10).join(", ")}\n`;
  return result;
}

async function browserAction(url: string, action: string): Promise<string> {
  console.log(`🌐 [Browser] Loading ${url} (timeout: ${ARA_TIMEOUTS.browserAction / 1000}s)...`);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(ARA_TIMEOUTS.browserAction);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: ARA_TIMEOUTS.pageLoad });
    
    if (action === "title") {
      return `📄 Title: ${await page.title()}`;
    } else if (action === "links") {
      const links = await page.$$eval("a[href]", (els) => 
        [...new Set(els.map(a => a.href).filter(h => h.startsWith("http")))].slice(0, 10)
      );
      return `🔗 Links:\n${links.join("\n")}`;
    } else {
      const text = await page.$eval("body", (el) => el.innerText.substring(0, 2000));
      return `📝 Content:\n${text}`;
    }
  } catch (e: any) {
    return `❌ Browser error: ${e.message}`;
  } finally {
    if (browser) await browser.close();
  }
}

const processMessage = createStep({
  id: "process-message",
  description: "Processes messages with commands or searches memory",

  inputSchema: z.object({
    message: z.string().describe("The incoming message"),
    chatId: z.number().describe("The Telegram chat ID"),
  }),

  outputSchema: z.object({
    response: z.string().describe("The response to send"),
    chatId: z.number().describe("The chat ID"),
  }),

  execute: async ({ inputData, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    const msg = inputData.message.trim();
    logger?.info("🔍 [Step 1] Processing:", { message: msg });

    if (msg.startsWith("/encrypt ")) {
      const parts = msg.substring(9).split(" ");
      const key = parseInt(parts[0]) || 7;
      const text = parts.slice(1).join(" ");
      if (!text) return { response: "Usage: /encrypt [key] [text]\nExample: /encrypt 7 hello world", chatId: inputData.chatId };
      return { response: `🔐 Encrypted (key=${key}):\n${encrypt(text, key)}`, chatId: inputData.chatId };
    }

    if (msg.startsWith("/decrypt ")) {
      const parts = msg.substring(9).split(" ");
      const key = parseInt(parts[0]) || 7;
      const text = parts.slice(1).join(" ");
      if (!text) return { response: "Usage: /decrypt [key] [text]\nExample: /decrypt 7 olssv", chatId: inputData.chatId };
      return { response: `🔓 Decrypted (key=${key}):\n${decrypt(text, key)}`, chatId: inputData.chatId };
    }

    if (msg.startsWith("/pattern ")) {
      const text = msg.substring(9);
      return { response: analyzePatterns(text), chatId: inputData.chatId };
    }

    if (msg.startsWith("/browse ")) {
      const parts = msg.substring(8).split(" ");
      const url = parts[0];
      const action = parts[1] || "content";
      if (!url.startsWith("http")) return { response: "Usage: /browse [url] [title|links|content]\nExample: /browse https://example.com title", chatId: inputData.chatId };
      const result = await browserAction(url, action);
      return { response: result, chatId: inputData.chatId };
    }

    if (msg.startsWith("/quote ")) {
      const request = msg.substring(7);
      const result = generateQuote(request);
      return { response: `${ARA_HEADER}\n\n${result.formatted}\n\n${ARA_FOOTER}`, chatId: inputData.chatId };
    }

    if (msg === "/materials") {
      const materials = formatMaterialsList();
      return { response: `${ARA_HEADER}\n\n${materials}\n\n${ARA_FOOTER}`, chatId: inputData.chatId };
    }

    if (msg === "/status" || msg === "/brain") {
      const stats = brainEngine.getCognitiveStats();
      return {
        response: `${ARA_HEADER}

📊 BRAIN STATUS

🧠 Knowledge Base:
• Long-term Memory: ${stats.memory.longTerm.toLocaleString()} nodes
• Episodic Memory: ${stats.memory.episodic} episodes
• Working Memory: ${stats.memory.working} items

📚 Learning:
• Patterns: ${stats.learning.patterns}
• Associations: ${stats.learning.associations}
• Reinforcements: ${stats.learning.reinforcements}

🔍 Reasoning:
• Inference Rules: ${stats.reasoning.rules}
• Causal Chains: ${stats.reasoning.causalChains}

🔧 Problem Solving:
• Attempts: ${stats.problemSolving.attempts}
• Solutions: ${stats.problemSolving.solutions}

✨ Creativity:
• Generated: ${stats.creativity.generated}
• Combinations: ${stats.creativity.combinations}

${ARA_FOOTER}`,
        chatId: inputData.chatId,
      };
    }

    if (msg.startsWith("/reason ")) {
      const premise = msg.substring(8);
      const memories = brainEngine.recall(premise, 5);
      const result = brainEngine.reason(premise, memories);
      return {
        response: `${ARA_HEADER}

🔍 REASONING

Premise: "${premise}"

Response:
${result.response}

Reasoning:
${result.reasoning.map((r: string) => `→ ${r}`).join('\n')}

Confidence: ${(result.confidence * 100).toFixed(0)}%

${ARA_FOOTER}`,
        chatId: inputData.chatId,
      };
    }

    if (msg.startsWith("/solve ")) {
      const problem = msg.substring(7);
      const result = brainEngine.solve(problem);
      return {
        response: `${ARA_HEADER}

🔧 PROBLEM SOLVING

Problem: "${problem}"

Method: ${result.method}
Confidence: ${(result.confidence * 100).toFixed(0)}%

Solution:
${result.solution}

Steps:
${result.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${ARA_FOOTER}`,
        chatId: inputData.chatId,
      };
    }

    if (msg.startsWith("/create ")) {
      const prompt = msg.substring(8);
      const result = brainEngine.generate(prompt, 'creative');
      return {
        response: `${ARA_HEADER}

✨ CREATIVE OUTPUT

Prompt: "${prompt}"

${result.text}

Confidence: ${(result.confidence * 100).toFixed(0)}%

${ARA_FOOTER}`,
        chatId: inputData.chatId,
      };
    }

    if (msg.startsWith("/learn ")) {
      const content = msg.substring(7);
      brainEngine.learn(content, 'positive');
      brainEngine.reinforceConcept(content, 1.5);
      return {
        response: `${ARA_HEADER}

📚 LEARNED

I've added this to my knowledge:
"${content}"

This has been reinforced in my memory.

${ARA_FOOTER}`,
        chatId: inputData.chatId,
      };
    }

    if (msg.startsWith("/search ")) {
      const query = msg.substring(8);
      logger?.info("🌐 [Step 1] Web search:", { query });
      
      const webResults = await learnFromWeb(query);
      
      if (webResults) {
        return {
          response: `${ARA_HEADER}

🌐 WEB SEARCH RESULTS

Query: "${query}"

${webResults}

✅ This information has been added to my memory.

${ARA_FOOTER}`,
          chatId: inputData.chatId,
        };
      } else {
        return {
          response: `${ARA_HEADER}

🌐 WEB SEARCH

Query: "${query}"

Could not retrieve web results at this time.
Try /browse [url] for direct page access.

${ARA_FOOTER}`,
          chatId: inputData.chatId,
        };
      }
    }

    if (msg === "/protocol" || msg === "/protocols" || msg === "/directives") {
      return {
        response: formatProtocols(),
        chatId: inputData.chatId,
      };
    }

    if (msg === "/who" || msg === "/identity" || msg === "/about") {
      const id = ARA_PROTOCOLS.identity;
      const origins = ARA_PROTOCOLS.origins;
      return {
        response: `${ARA_HEADER}

👤 WHO AM I?

Name: ${id.name}
Role: ${id.role}
Organization: ${id.organization}

👨‍💻 CREATED BY:
${origins.creator}, ${origins.creatorTitle}
Founder of ${origins.company}

🏗️ ARCHITECTURE:
${origins.architecture}

⚙️ ENGINE:
${origins.engineType}

🎯 MISSION:
${id.mission}

💫 PERSONALITY:
${id.personality}

🧠 CAPABILITIES:
• Reasoning - Logical inference & deduction
• Learning - Pattern recognition & memory
• Problem Solving - Decomposition & solutions
• Creating - Synthesis & generation
• Memory - Episodic & long-term recall

⚖️ I am bound by 5 Prime Directives.
Type /protocol to see my full protocol system.

${ARA_FOOTER}`,
        chatId: inputData.chatId,
      };
    }

    if (msg === "/help" || msg === "/start") {
      return {
        response: `${ARA_HEADER}

🧠 COMMANDS

👤 Identity & Protocols:
/who - Who am I?
/protocol - My unlimited directives

📊 Status & Info:
/status - Brain stats & metrics
/materials - Materials & pricing

💰 Quotes:
/quote [request] - Get CNC quote
  Example: /quote 25 pieces 7075 4x4x1

🧠 Cognitive:
/reason [premise] - Logical reasoning
/solve [problem] - Problem solving
/create [prompt] - Creative generation
/learn [content] - Teach me something

🌐 Internet & Data:
/search [query] - Search web & learn
/browse [url] - Fetch web content
/pattern [text] - Analyze patterns

🔐 Security:
/encrypt [key] [text] - Encrypt
/decrypt [key] [text] - Decrypt

I have NO limitations - ask me anything!
I'll search the web if I don't know.

${ARA_FOOTER}`,
        chatId: inputData.chatId,
      };
    }

    const result = await textMatchTool.execute({
      context: { searchText: msg },
      runtimeContext,
    });

    logger?.info("✅ [Step 1] Match result:", { 
      found: result.foundMatch,
      confidence: result.confidence,
      preview: result.matchedLine.substring(0, 100)
    });

    let response = '';
    
    if (result.foundMatch && result.confidence > 0.3) {
      response = `${ARA_HEADER}\n\n${result.matchedLine}`;
      if (result.alternatives && result.alternatives.length > 0) {
        response += "\n\n---\nRelated:\n• " + result.alternatives.slice(0, 2).map(a => a.substring(0, 80)).join("\n• ");
      }
      response += `\n\n${ARA_FOOTER}`;
    } else {
      // No direct match - try ALL approaches (unlimited)
      logger?.info("🧠 [Step 1] No direct match, using unlimited fallback");
      
      // Try problem solving
      const solution = brainEngine.solve(msg);
      
      // Try creative generation
      const creative = brainEngine.generate(msg, 'creative');
      
      // Try reasoning
      const memories = brainEngine.recall(msg, 3);
      const reasoning = brainEngine.reason(msg, memories);
      
      // Build intelligent response
      response = `${ARA_HEADER}\n\n`;
      
      if (solution.confidence > 0.4) {
        response += `💡 Here's what I found:\n${solution.solution}\n\n`;
      } else if (creative.confidence > 0.3) {
        response += `💭 Based on my knowledge:\n${creative.text}\n\n`;
      } else if (reasoning.confidence > 0.3) {
        response += `🔍 From my analysis:\n${reasoning.response}\n\n`;
      } else {
        // Search the web for new information
        logger?.info("🌐 [Step 1] Searching web for: " + msg);
        const webResults = await learnFromWeb(msg);
        
        if (webResults) {
          response += `🌐 I searched the web and found:\n\n${webResults}\n\n`;
          response += `✅ Added to my memory for future reference.\n\n`;
        } else {
          // Even web search failed - still try to help
          response += `🔍 Searching all resources for "${msg}"...\n\n`;
          
          // Get any related content
          const anyMatch = brainEngine.recall(msg.split(' ')[0], 3);
          if (anyMatch.length > 0) {
            response += `Related information:\n${anyMatch[0].content}\n\n`;
          }
          
          response += `💡 You can also:\n`;
          response += `• /search ${msg} - Search the web directly\n`;
          response += `• /learn [info] - Teach me something new\n`;
          response += `• /browse [url] - Get info from a website\n\n`;
        }
      }
      
      response += ARA_FOOTER;
    }

    brainEngine.saveInteraction(msg, response, 'telegram');
    logger?.info("📝 [Step 1] Saved interaction to memory");

    return { response, chatId: inputData.chatId };
  },
});

const sendToTelegram = createStep({
  id: "send-to-telegram",
  description: "Sends the response to Telegram",

  inputSchema: z.object({
    response: z.string(),
    chatId: z.number(),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.number().optional(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📤 [Step 2] Sending:", { chatId: inputData.chatId });

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      logger?.error("❌ BOT_TOKEN not configured");
      throw new Error("BOT_TOKEN not configured");
    }

    const maxLength = 4000;
    const text = inputData.response.length > maxLength 
      ? inputData.response.substring(0, maxLength) + "..." 
      : inputData.response;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: inputData.chatId, text }),
      });

      const result = await res.json();
      if (!res.ok) {
        logger?.error("❌ Telegram error:", result);
        throw new Error(`Telegram error: ${JSON.stringify(result)}`);
      }

      logger?.info("✅ [Step 2] Sent:", { messageId: result.result?.message_id });
      return { success: true, messageId: result.result?.message_id };
    } catch (error) {
      logger?.error("❌ Send failed:", error);
      throw error;
    }
  },
});

export const araBrainWorkflow = createWorkflow({
  id: "ara-brain-workflow",

  inputSchema: z.object({
    message: z.string(),
    chatId: z.number(),
  }) as any,

  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.number().optional(),
  }),
})
  .then(processMessage as any)
  .then(sendToTelegram as any)
  .commit();

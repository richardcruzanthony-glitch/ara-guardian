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
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    
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

    if (msg === "/help" || msg === "/start") {
      return {
        response: `${ARA_HEADER}

🧠 COMMANDS

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

🔐 Security:
/encrypt [key] [text] - Encrypt
/decrypt [key] [text] - Decrypt

🌐 Web:
/browse [url] - Fetch web content
/pattern [text] - Analyze patterns

Or just ask me anything!

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
      // No direct match - try cognitive approach
      logger?.info("🧠 [Step 1] No direct match, using cognitive fallback");
      
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
        // Last resort - suggest what I know about
        const stats = brainEngine.getCognitiveStats();
        response += `I don't have specific information about "${msg}" yet.\n\n`;
        response += `💡 Try asking about:\n`;
        response += `• CNC machining & materials\n`;
        response += `• Manufacturing processes\n`;
        response += `• Pricing & quotes (/quote)\n`;
        response += `• Guardian Sentinel services\n\n`;
        response += `Or teach me: /learn [your knowledge]\n\n`;
        response += `📊 Brain: ${stats.memory.longTerm.toLocaleString()} memories loaded\n`;
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

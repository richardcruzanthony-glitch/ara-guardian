// src/triggers/telegramTriggers.ts

import { Mastra } from "@mastra/core";
import TelegramBot from "node-telegram-bot-api";

// Reads BOT_TOKEN from environment variables
const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  throw new Error("BOT_TOKEN environment variable is not set");
}

// Create a Telegram bot instance
const bot = new TelegramBot(botToken, { polling: true });

/**
 * Registers a Telegram trigger with Mastra.
 * This listens for messages and can forward them into your Mastra agents/tools.
 */
export function registerTelegramTrigger(mastra: Mastra) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";

    try {
      // Example: forward the message into Mastra for processing
      const agents = mastra.getAgents();
      const agentIds = Object.keys(agents);

      if (agentIds.length > 0) {
        const agent = agents[agentIds[0]];
        const response = await agent.run({ input: text });

        await bot.sendMessage(chatId, response.output || "No response");
      } else {
        await bot.sendMessage(chatId, "No agents available in Mastra");
      }
    } catch (err) {
      console.error("Error handling Telegram message:", err);
      await bot.sendMessage(chatId, "An error occurred while processing your request.");
    }
  });
}

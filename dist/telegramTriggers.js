// src/telegramTriggers.ts
// DISABLED: node-telegram-bot-api not installed
// To enable: npm install node-telegram-bot-api @types/node-telegram-bot-api
// import TelegramBot from "node-telegram-bot-api";
/**
 * Registers a Telegram trigger with Mastra.
 * This listens for messages and can forward them into your Mastra agents/tools.
 *
 * CURRENTLY DISABLED - Install dependency first:
 * npm install node-telegram-bot-api @types/node-telegram-bot-api
 */
export function registerTelegramTrigger(mastra) {
    console.log("⚠️ Telegram polling mode disabled - install node-telegram-bot-api to enable");
    // Use webhook mode in src/triggers/telegramTriggers.ts instead
    /*
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      throw new Error("BOT_TOKEN environment variable is not set");
    }
  
    const bot = new TelegramBot(botToken, { polling: true });
  
    bot.on("message", async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text || "";
  
      try {
        const agents = mastra.getAgents();
        const agentIds = Object.keys(agents);
  
        if (agentIds.length > 0) {
          const agent = agents[agentIds[0]];
          const response = await agent.generate({
            messages: [{ role: "user", content: text }]
          });
  
          await bot.sendMessage(chatId, response.text || "No response");
        } else {
          await bot.sendMessage(chatId, "No agents available in Mastra");
        }
      } catch (err) {
        console.error("Error handling Telegram message:", err);
        await bot.sendMessage(chatId, "An error occurred while processing your request.");
      }
    });
    */
}

// src/telegramTriggers.ts
// Telegram polling integration with Mastra
// Uses node-telegram-bot-api for bot polling
import TelegramBot from "node-telegram-bot-api";
/**
 * Registers a Telegram trigger with Mastra.
 * This listens for messages via polling and forwards them to Mastra agents.
 */
export function registerTelegramTrigger(mastra) {
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        console.warn("⚠️ BOT_TOKEN environment variable not set - Telegram integration disabled");
        return;
    }
    try {
        const bot = new TelegramBot(botToken, { polling: true });
        console.log("✅ Telegram bot initialized (polling mode)");
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
                }
                else {
                    await bot.sendMessage(chatId, "No agents available in Mastra");
                }
            }
            catch (err) {
                console.error("Error handling Telegram message:", err);
                await bot.sendMessage(chatId, "An error occurred while processing your request.");
            }
        });
        bot.on("polling_error", (error) => {
            console.error("Telegram polling error:", error);
        });
    }
    catch (err) {
        console.error("Failed to initialize Telegram bot:", err);
    }
}

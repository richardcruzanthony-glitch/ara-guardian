import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { textMatchTool } from "../tools/textMatchTool";

const processMessage = createStep({
  id: "process-message",
  description: "Searches the memory file for a matching line based on the incoming message",

  inputSchema: z.object({
    message: z.string().describe("The incoming message to search for"),
    chatId: z.number().describe("The Telegram chat ID to reply to"),
  }),

  outputSchema: z.object({
    response: z.string().describe("The response to send back"),
    chatId: z.number().describe("The chat ID to send the response to"),
  }),

  execute: async ({ inputData, mastra, runtimeContext }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔍 [Step 1] Processing message:", { message: inputData.message });

    const result = await textMatchTool.execute({
      context: {
        searchText: inputData.message,
      },
      runtimeContext,
    });

    logger?.info("✅ [Step 1] Got response:", { 
      matchedLine: result.matchedLine, 
      foundMatch: result.foundMatch 
    });

    return {
      response: result.matchedLine,
      chatId: inputData.chatId,
    };
  },
});

const sendToTelegram = createStep({
  id: "send-to-telegram",
  description: "Sends the response back to the Telegram chat",

  inputSchema: z.object({
    response: z.string().describe("The response to send"),
    chatId: z.number().describe("The Telegram chat ID"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.number().optional(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📤 [Step 2] Sending to Telegram:", { 
      chatId: inputData.chatId, 
      response: inputData.response 
    });

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      logger?.error("❌ [Step 2] BOT_TOKEN not configured");
      throw new Error("BOT_TOKEN not configured");
    }

    try {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: inputData.chatId,
            text: inputData.response,
          }),
        }
      );

      const result = await telegramResponse.json();
      
      if (!telegramResponse.ok) {
        logger?.error("❌ [Step 2] Telegram API error:", result);
        throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
      }

      logger?.info("✅ [Step 2] Message sent successfully:", { 
        messageId: result.result?.message_id 
      });

      return {
        success: true,
        messageId: result.result?.message_id,
      };
    } catch (error) {
      logger?.error("❌ [Step 2] Failed to send message:", error);
      throw error;
    }
  },
});

export const araBrainWorkflow = createWorkflow({
  id: "ara-brain-workflow",

  inputSchema: z.object({
    message: z.string().describe("The incoming Telegram message"),
    chatId: z.number().describe("The Telegram chat ID to reply to"),
  }) as any,

  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.number().optional(),
  }),
})
  .then(processMessage as any)
  .then(sendToTelegram as any)
  .commit();

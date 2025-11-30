/**
 * Telegram Trigger - Webhook-based Workflow Triggering
 *
 * This module provides Telegram bot event handling for Mastra workflows.
 * When Telegram messages are received, this trigger starts your workflow.
 *
 * PATTERN:
 * 1. Import registerTelegramTrigger and your workflow
 * 2. Call registerTelegramTrigger with a triggerType and handler
 * 3. Spread the result into the apiRoutes array in src/mastra/index.ts
 *
 * USAGE in src/mastra/index.ts:
 *
 * ```typescript
 * import { registerTelegramTrigger } from "../triggers/telegramTriggers";
 * import { telegramBotWorkflow } from "./workflows/telegramBotWorkflow";
 *
 * // In the apiRoutes array:
 * ...registerTelegramTrigger({
 *   triggerType: "telegram/message",
 *   handler: async (mastra, triggerInfo) => {
 *     const run = await telegramBotWorkflow.createRunAsync();
 *     return await run.start({ inputData: {} });
 *   }
 * })
 * ```
 */

import { registerApiRoute } from "../mastra/inngest";
import { Mastra } from "@mastra/core";

if (!process.env.BOT_TOKEN) {
  console.warn(
    "⚠️ BOT_TOKEN environment variable not set. Telegram triggers may not work until configured."
  );
}

export type TriggerInfoTelegramOnNewMessage = {
  type: "telegram/message";
  params: {
    userName: string;
    message: string;
  };

/**
 * Mastra Main Entry
 *
 * This sets up workflows and triggers for your application.
 * Telegram triggers are webhook-based and added to apiRoutes.
 * Cron triggers are scheduled and registered before Mastra initialization.
 */

import { Mastra } from "@mastra/core";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";
import { registerCronTrigger } from "../triggers/cronTriggers";

// Import your actual workflow files
import { telegramBotWorkflow } from "./workflows/telegramBotWorkflow";
import { anotherWorkflow } from "./workflows/anotherWorkflow"; // replace if different

// --------------------
// Cron Trigger Setup
// --------------------
// Register any cron workflows BEFORE creating Mastra instance
registerCronTrigger({
  cronExpression: "0 8 * * *", // Example: daily at 8 AM
  workflow: anotherWorkflow, // Replace with the workflow you want to run on a schedule
});

// --------------------
// Mastra Instance
// --------------------
export const mastra = new Mastra({
  // Add Mastra config if needed
  apiRoutes: [
    // Telegram Trigger Setup
    ...registerTelegramTrigger({
      triggerType: "telegram/message",
      handler: async (mastra, triggerInfo) => {
        const run = await telegramBotWorkflow.createRunAsync();
        return await run.start({ inputData: {} });
      },
    }),
    // You can add more webhook triggers here if needed
  ],
});

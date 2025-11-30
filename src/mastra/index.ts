/**
 * Main Mastra initialization file
 *
 * This file sets up all triggers (cron, Telegram, etc.) before creating
 * the Mastra instance.
 */

import { Mastra } from "mastra"; // adjust import if different
import { registerCronTrigger } from "../triggers/cronTriggers";
import { registerTelegramTrigger } from "../triggers/telegramTriggers";

// Import workflows that actually exist
import { araBrainWorkflow } from "../workflows/araBrainWorkflow";
import { exampleWorkflow } from "../workflows/exampleWorkflow";

/**
 * ------------------------------
 * Register Cron Triggers
 * ------------------------------
 * Example: Run exampleWorkflow daily at 8 AM
 */
registerCronTrigger({
  cronExpression: "0 8 * * *", // Daily at 8 AM
  workflow: exampleWorkflow
});

/**
 * ------------------------------
 * Register Telegram Triggers
 * ------------------------------
 * This sets up a Telegram message trigger that starts araBrainWorkflow.
 * You can extend this for multiple Telegram workflows if needed.
 */
export const apiRoutes = [
  ...registerTelegramTrigger({
    triggerType: "telegram/message",
    handler: async (mastra, triggerInfo) => {
      // Start a run of araBrainWorkflow when a Telegram message is received
      const run = await araBrainWorkflow.createRunAsync();
      return await run.start({ inputData: { message: triggerInfo.message } });
    }
  })
];

/**
 * ------------------------------
 * Create Mastra instance
 * ------------------------------
 */
export const mastra = new Mastra({
  // Add your Mastra configuration here
  // Example:
  name: "ara-guardian",
  apiRoutes, // include the Telegram triggers
});

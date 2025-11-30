// src/mastra/index.ts

// --- Mastra core ---
import { MastraApp } from "mastra";

// --- Workflows ---
import { araBrainWorkflow } from "../workflows/araBrainWorkflow";
import { exampleWorkflow } from "../workflows/exampleWorkflow";

// --- Triggers ---
import { telegramTriggers } from "../triggers/telegramTriggers";
import { slackTriggers } from "../triggers/slackTriggers";
import { cronTriggers } from "../triggers/cronTriggers";
import { exampleConnectorTrigger } from "../triggers/exampleConnectorTrigger";

// --- Initialize Mastra app ---
export const app = new MastraApp({
  workflows: [
    araBrainWorkflow,
    exampleWorkflow,
  ],
  triggers: [
    telegramTriggers,
    slackTriggers,
    cronTriggers,
    exampleConnectorTrigger,
  ],
});

// --- Optional: Start the app (if needed) ---
if (require.main === module) {
  app.start().catch((err) => {
    console.error("Mastra app failed to start:", err);
  });
}

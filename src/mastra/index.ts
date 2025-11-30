// src/mastra/index.ts
/**
 * Mastra Entry Point
 *
 * Registers all agents, workflows, triggers, and tools
 * for the Mastra application. Paths are aligned with
 * your project structure.
 */

// --- Mastra core ---
import { MastraApp } from "mastra";
import { Mastra } from "mastra";

// --- Agents ---
import { exampleAgent } from "../agents/exampleAgent";

// --- Workflows ---
import { araBrainWorkflow } from "../workflows/araBrainWorkflow";
import { exampleWorkflow } from "../workflows/exampleWorkflow";

// --- Triggers ---
import { telegramTriggers } from "../triggers/telegramTriggers";
import { slackTriggers } from "../triggers/slackTriggers";
import { cronTriggers } from "../triggers/cronTriggers";
import { exampleConnectorTrigger } from "../triggers/exampleConnectorTrigger";

// --- Tools ---
import { exampleTool } from "../tools/exampleTool";
import { autoPostTool } from "../tools/autoPostTool";
import { brainEngine } from "../tools/brainEngine";
import { grokReasoning } from "../tools/grokReasoning";
import { guardianPricing } from "../tools/guardianPricing";
import { guardianQuoteTool } from "../tools/guardianQuoteTool";
import { textMatchTool } from "../tools/textMatchTool";

// --- Shared Storage ---
import { sharedPostgresStorage } from "../storage";

// --- Initialize Mastra App ---
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

// --- Initialize Mastra Instance ---
export const mastra = new Mastra({
  agents: [exampleAgent],
  workflows: [araBrainWorkflow, exampleWorkflow],
  tools: {
    exampleTool,
    autoPostTool,
    brainEngine,
    grokReasoning,
    guardianPricing,
    guardianQuoteTool,
    textMatchTool,
  },
  defaultMemory: {
    storage: sharedPostgresStorage,
    options: {
      threads: { generateTitle: true },
      lastMessages: 10,
    },
  },
  // debug: true, // Optional: enable debug logs if needed
});

// --- Optional: start the Mastra app if running this file directly ---
if (require.main === module) {
  app.start().catch((err) => {
    console.error("Mastra app failed to start:", err);
  });
}

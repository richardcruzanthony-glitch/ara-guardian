// src/mastra/index.ts
/**
 * Mastra Entry Point
 *
 * Registers all agents, workflows, triggers, and global tools.
 * Paths are verified against the current project structure.
 */

// --- Mastra core ---
import { MastraApp, Mastra } from "mastra";

// --- Agents ---
import { exampleAgent } from "./agents/exampleAgent"; // Fixed relative path

// --- Workflows ---
import { araBrainWorkflow } from "../workflows/araBrainWorkflow";
import { exampleWorkflow } from "../workflows/exampleWorkflow";

// --- Triggers ---
import { cronTriggers } from "../triggers/cronTriggers";
import { exampleConnectorTrigger } from "../triggers/exampleConnectorTrigger";
import { slackTriggers } from "../triggers/slackTriggers";
import { telegramTriggers } from "../triggers/telegramTriggers";

// --- Tools ---
import { exampleTool } from "../tools/exampleTool";
import { autoPostTool } from "../tools/autoPostTool";
import { brainEngine } from "../tools/brainEngine";
import { grokReasoning } from "../tools/grokReasoning";
import { guardianPricing } from "../tools/guardianPricing";
import { guardianQuoteTool } from "../tools/guardianQuoteTool";
import { textMatchTool } from "../tools/textMatchTool";

// --- Storage ---
import { sharedPostgresStorage } from "../storage";

// --- Mastra App ---
export const app = new MastraApp({
  workflows: [
    araBrainWorkflow,
    exampleWorkflow,
  ],
  triggers: [
    cronTriggers,
    exampleConnectorTrigger,
    slackTriggers,
    telegramTriggers,
  ],
});

// --- Mastra Core ---
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
  // debug: true, // Optional
});

// --- Auto-start if run directly ---
if (require.main === module) {
  app.start().catch((err) => {
    console.error("Mastra app failed to start:", err);
  });
}

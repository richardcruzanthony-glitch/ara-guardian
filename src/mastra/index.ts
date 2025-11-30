// src/mastra/index.ts
import { MastraApp, Mastra } from "mastra";

// Agents
import { exampleAgent } from "./agents/exampleAgent";

// Workflows (outside mastra/ — in src/workflows/)
import { araBrainWorkflow } from "../workflows/araBrainWorkflow";
import { exampleWorkflow } from "../workflows/exampleWorkflow";

// Triggers (root-level triggers/ directory)
import { cronTriggers } from "../../triggers/cronTriggers";
import { exampleConnectorTrigger } from "../../triggers/exampleConnectorTrigger";
import { slackTriggers } from "../../triggers/slackTriggers";
import { telegramTriggers } from "../../triggers/telegramTriggers";

// Tools (inside mastra/tools/)
import { exampleTool } from "./tools/exampleTool";
import { autoPostTool } from "./tools/autoPostTool";
import { brainEngine } from "./tools/brainEngine";
import { grokReasoning } from "./tools/grokReasoning";
import { guardianPricing } from "./tools/guardianPricing";
import { guardianQuoteTool } from "./tools/guardianQuoteTool";
import { textMatchTool } from "./tools/textMatchTool";

// Storage (inside mastra/storage/index.ts)
import { sharedPostgresStorage } from "./storage";

// Mastra App + setup
export const app = new MastraApp({
  workflows: [araBrainWorkflow, exampleWorkflow],
  triggers: [cronTriggers, exampleConnectorTrigger, slackTriggers, telegramTriggers],
});

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
});

if (require.main === module) {
  app.start().catch((err) => {
    console.error("Mastra app failed to start:", err);
  });
}

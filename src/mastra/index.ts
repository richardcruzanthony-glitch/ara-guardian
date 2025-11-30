/**
 * Mastra Entry Point
 *
 * Registers all agents and workflows for the Mastra app.
 * Paths are verified against your current project structure.
 */

import { Mastra } from "mastra";

// Agents
import { exampleAgent } from "../agents/exampleAgent";

// Workflows
import { araBrainWorkflow } from "../workflows/araBrainWorkflow";
import { exampleWorkflow } from "../workflows/exampleWorkflow";

// Tools (optional if used globally)
import { exampleTool } from "../tools/exampleTool";
import { autoPostTool } from "../tools/autoPostTool";
import { brainEngine } from "../tools/brainEngine";
import { grokReasoning } from "../tools/grokReasoning";
import { guardianPricing } from "../tools/guardianPricing";
import { guardianQuoteTool } from "../tools/guardianQuoteTool";
import { textMatchTool } from "../tools/textMatchTool";

// Shared storage for memory (PostgreSQL)
import { sharedPostgresStorage } from "../storage";

export const mastra = new Mastra({
  // Register all agents
  agents: [exampleAgent],

  // Register all workflows
  workflows: [araBrainWorkflow, exampleWorkflow],

  // Optional: global tools can be referenced in workflows or agents
  tools: {
    exampleTool,
    autoPostTool,
    brainEngine,
    grokReasoning,
    guardianPricing,
    guardianQuoteTool,
    textMatchTool,
  },

  // Optional global memory settings for agents that don't specify their own memory
  defaultMemory: {
    storage: sharedPostgresStorage,
    options: {
      threads: { generateTitle: true },
      lastMessages: 10,
    },
  },

  /**
   * Optional global settings
   * debug: true,   // enable debug logs if needed
   */
});

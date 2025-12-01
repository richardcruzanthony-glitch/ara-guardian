import { Workflow } from "@mastra/core/workflow";

import { brainEngine } from "../tools/brainEngine";
import { guardianQuoteTool } from "../tools/guardianQuoteTool";
import { grokReasoning } from "../tools/grokReasoning";
import { getMaterialsList } from "../tools/guardianPricing"; // adjust if needed

// ---------------------------
// ARA BRAIN WORKFLOW
// ---------------------------

export const araBrainWorkflow = new Workflow({
  id: "ara-brain-workflow",
  description: "Primary reasoning workflow for the Ara Guardian system.",

  inputs: {
    prompt: {
      type: "string",
      required: true,
      description: "User message to process using the Ara Brain pipeline.",
    },
  },

  steps: {
    think: async ({ inputs }) => {
      return await brainEngine.run({
        prompt: inputs.prompt,
      });
    },

    reasoning: async ({ steps }) => {
      return await grokReasoning.run({
        context: steps.think.output,
      });
    },

    materials: async ({ inputs }) => {
      return await getMaterialsList.run({
        query: inputs.prompt,
      });
    },

    quote: async ({ steps }) => {
      return await guardianQuoteTool.run({
        request: steps.reasoning.output,
      });
    },
  },

  output: async ({ steps }) => {
    return {
      analysis: steps.think.output,
      reasoning: steps.reasoning.output,
      materials: steps.materials.output,
      quote: steps.quote.output,
    };
  },
});

// src/mastra/workflows/araBrainWorkflow.ts

import { createWorkflow, createStep } from "@mastra/workflow";
import { brainEngine } from "../tools/brainEngine";
import { generateQuote } from "../tools/generateQuote";
import { getMaterialsList } from "../tools/getMaterialsList";
import { grokReasoning } from "../tools/grokReasoning";

export const araBrainWorkflow = createWorkflow({
  id: "ara-brain-workflow",
  name: "Ara Brain Workflow",

  trigger: {
    type: "http",
    method: "POST",
    path: "/brain",
  },

  run: async ({ step, payload }) => {

    // 🧠 Step 1: Use brain engine
    const brainResult = await step.run(
      "brain-engine",
      async () => {
        return await brainEngine.run({
          message: payload.message ?? "",
        });
      }
    );

    // ✍️ Step 2: Generate quote
    const quote = await step.run(
      "generate-quote",
      async () => generateQuote.run({})
    );

    // 📦 Step 3: Material list if requested
    const materials = await step.run(
      "materials-list",
      async () => {
        if (payload.includeMaterials) {
          return await getMaterialsList.run({});
        }
        return null;
      }
    );

    // 🔮 Step 4: Grok reasoning (optional)
    const reasoning = await step.run(
      "grok-reasoning",
      async () => {
        if (payload.useGrok) {
          return await grokReasoning.run({
            input: payload.message ?? "",
          });
        }
        return null;
      }
    );

    return {
      success: true,
      brainResult,
      quote,
      materials,
      reasoning,
    };
  },
});

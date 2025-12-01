// src/mastra/inngest/index.ts

import { inngest } from "@mastra/inngest";

// You can register functions here later.
// Right now it returns a clean, valid Inngest server object.
export const inngestServe = inngest({
  functions: [],

  // Global error handler for Inngest functions
  onFunctionRunError: async ({ error, step }) => {
    console.error("Inngest function error:", error);

    // Mastra 1.0 no longer supports NonRetriableError.
    // Use plain Error instead.
    return new Error("Inngest function failed");
  }
});

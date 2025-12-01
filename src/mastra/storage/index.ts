import { FileStore } from "@mastra/core/storage";

export const mastra = new Mastra({
  telemetry: { enabled: false },

  storage: new FileStore({
    filePath: "/opt/render/project/src/us-complete.txt",
  }),

  workflows: { araBrainWorkflow },
  tools: [brainEngine, generateQuote, getMaterialsList, grokReasoning],

  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
  },

  inngest: { serve: inngestServe },

  mcpServers: {
    allTools: new MCPServer({ name: "allTools", version: "1.0.0", tools: {} }),
  },

  // keep the rest unchanged…
});

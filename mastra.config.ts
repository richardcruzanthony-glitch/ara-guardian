// mastra.config.ts  <-- create this file in the root (same level as package.json)
import type { MastraConfig } from "@mastra/core";

const config: MastraConfig = {
  telemetry: {
    enabled: false,           // this is read by the CLI at bundle time
  },
  bundler: {
    external: [
      "zod",
      "@mastra/core",
      "@mastra/mcp",
      "@mastra/inngest",
      "@mastra/memory",
      "@mastra/pg",
      "@mastra/libsql",
      "@mastra/loggers",
      "inngest",
      "ai",
      "@ai-sdk/openai",
      "@openrouter/ai-sdk-provider",
      "openai",
      "exa-js",
      "puppeteer",
      "@slack/web-api",
      "pg",
      "pino",
    ],
  },
};

export default config;

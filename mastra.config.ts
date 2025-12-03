import type { MastraConfig } from "@mastra/core";

const config: MastraConfig = {
  telemetry: {
    enabled: false,
  },
  deploy: {
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
        "dotenv",
      ],
    },
  },
};

export default config;

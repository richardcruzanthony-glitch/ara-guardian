// mastra.config.ts  <-- create this file in the root (same level as package.json)
import type { MastraConfig } from "@mastra/core";

const config: MastraConfig = {
  telemetry: {
    enabled: false,           // this is read by the CLI at bundle time
  },
};

export default config;

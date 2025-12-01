// src/mastra/telemetry.ts
import { Mastra } from "@mastra/core";

/**
 * Setup telemetry for Mastra.
 * This avoids referencing a global `mastra` variable.
 * Call it from index.ts and pass in your Mastra instance.
 */
export function setupTelemetry(mastra: Mastra) {
  // If telemetry is disabled, do nothing
  if (!mastra.config?.telemetry || mastra.config.telemetry.enabled === false) {
    return;
  }

  // Example: attach telemetry hooks here
  const logger = mastra.getLogger();
  logger.info("Telemetry initialized");

  // You can extend this with custom telemetry logic:
  // - log agent runs
  // - log tool usage
  // - send metrics to an external service
}

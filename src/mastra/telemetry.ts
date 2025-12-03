// src/mastra/telemetry.ts
import { Mastra } from "@mastra/core";

/**
 * Setup telemetry for Mastra.
 * This avoids referencing a global `mastra` variable.
 * Call it from index.ts and pass in your Mastra instance.
 */
export function setupTelemetry(mastra: Mastra) {
  // Telemetry is disabled globally via environment variable
  // No need to check config since it's not accessible in current API
  
  const logger = mastra.getLogger();
  logger.info("Telemetry setup called (disabled globally)");

  // You can extend this with custom telemetry logic:
  // - log agent runs
  // - log tool usage
  // - send metrics to an external service
}

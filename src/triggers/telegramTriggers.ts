import type { Mastra } from "@mastra/core";

/**
 * Telegram webhook helper currently disabled because registerApiRoute
 * is not available in Mastra v0.20+. Keeping the helper signature simple
 * lets callers wire it up safely once support returns.
 */
export function registerTelegramTrigger(mastra: Mastra) {
  const logger = mastra.getLogger?.();
  logger?.warn("Telegram trigger registration skipped - API not compatible with Mastra v0.20+");
  // Fall back to console for environments without logger wiring.
  console.warn("Telegram trigger registration skipped - API not compatible with Mastra v0.20+");
}

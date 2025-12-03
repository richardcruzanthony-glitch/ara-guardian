/**
 * Example Connector Trigger - Linear Webhook Handler
 *
 * This demonstrates how to create a webhook handler for any connector.
 * Linear is just an example - replace with your connector name.
 *
 * PATTERN:
 * 1. Define types for the webhook payload (optional, but helpful)
 * 2. Create a registration function that sets up the webhook route
 * 3. Pass the full payload to the handler - let the consumer pick what they need
 * 4. Register in src/mastra/index.ts
 *
 * See docs/triggers/webhook_connector_triggers.md for complete guide.
 */
/**
 * Register a Linear webhook trigger handler
 *
 * Usage in src/mastra/index.ts:
 *
 * ```typescript
 * import { exampleWorkflow } from "./workflows/exampleWorkflow";
 *
 * ...registerLinearTrigger({
 *   triggerType: "linear/issue.created",
 *   handler: async (mastra, triggerInfo) => {
 *     // Extract what you need from the payload
 *     const data = triggerInfo.payload?.data || {};
 *     const title = data.title || data.name || "Untitled";
 *
 *     // Start your workflow
 *     const run = await exampleWorkflow.createRunAsync();
 *     return await run.start({
 *       inputData: {
 *         message: `Linear Issue: ${title}`,
 *         includeAnalysis: true,
 *       }
 *     });
 *   }
 * })
 * ```
 */
export function registerLinearTrigger({ triggerType, handler, }) {
    // DISABLED: registerApiRoute not available
    console.warn("Linear trigger registration skipped - API not compatible with Mastra v0.20+");
    return [];
    /* Original implementation:
    return [
      registerApiRoute("/linear/webhook", {
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
  
          try {
            const payload = await c.req.json();
            console.log("📥 [Linear] Webhook received", { payload });
  
            // Only process Issue creation events
            if (payload.action !== "create" || payload.type !== "Issue") {
              console.log("⏭️ [Linear] Skipping event", {
                action: payload.action,
                type: payload.type,
              });
              return c.json({ success: true, skipped: true });
            }
  
            // Ensure data exists (use empty object as fallback)
            if (!payload.data) {
              console.log("⚠️ [Linear] Missing data field, using empty object");
              payload.data = {};
            }
  
            // Pass the full payload - let the consumer pick what they need
            const triggerInfo: TriggerInfoLinearIssueCreated = {
              type: triggerType,
              payload: payload as LinearWebhookPayload,
            };
  
            console.log("🚀 [Linear] Triggering handler");
  
            const result = await handler(mastra, triggerInfo);
  
            console.log("✅ [Linear] Handler completed", { result });
  
            return c.json({ success: true, result });
          } catch (error) {
            logger?.error("❌ [Linear] Error processing webhook", {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
  
            return c.json(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
              },
              500,
            );
          }
        },
      }),
    ];
    */
}

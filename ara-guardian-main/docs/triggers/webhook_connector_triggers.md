# Connector Webhook Triggers

Create webhook handlers for third-party connectors (Linear, GitHub, Slack, etc.) that trigger Mastra workflows.

**NOTE:** This document describes how dev/prod runs the full routing.  The agent may need to know how to query the Mastra server to run directly agents, workflows, etc.  You should disregard this documentation in that case and consult the Mastra doc (docs/mastra/**).

## Quick Start

**2 steps to add a connector webhook:**

### 1. Create `src/triggers/{connector}Triggers.ts`

```typescript
import { registerApiRoute } from "../mastra/inngest";

export function register{Connector}Trigger({ triggerType, handler }) {
  return [
    registerApiRoute("/{connector}/webhook", {
      method: "POST",
      handler: async (c) => {
        const mastra = c.get("mastra");
        const logger = mastra?.getLogger();
        
        try {
          const payload = await c.req.json();
          logger?.info("📥 [{Connector}] Webhook received", { payload });
          
          // Only process events you care about (optional)
          if (payload.action !== "created" && payload.action !== "updated") {
            logger?.info("[{Connector}] Skipping event", { action: payload.action });
            return c.json({ success: true, skipped: true });
          }
          
          // Pass the entire payload - let the consumer pick what they need
          const triggerInfo = {
            type: triggerType,
            payload,
          };
          
          const result = await handler(mastra, triggerInfo);
          return c.json({ success: true, result });
        } catch (error) {
          logger?.error("Error:", { error });
          return c.json({ success: false, error: String(error) }, 500);
        }
      },
    }),
  ];
}
```

### 2. Register in `src/mastra/index.ts`

```typescript
import { register{Connector}Trigger } from "../triggers/{connector}Triggers";
import { exampleWorkflow } from "./workflows/exampleWorkflow";

// In server > apiRoutes array:
...register{Connector}Trigger({
  triggerType: "{connector}/{event}",
  handler: async (mastra, triggerInfo) => {
    const logger = mastra?.getLogger();
    
    // Extract what you need from the payload with loud fallbacks
    const data = triggerInfo.payload?.data || {};
    
    // Log when using fallbacks so you know something's missing
    const title = data.title || data.name || (() => {
      logger?.warn("[{Connector}] Missing title/name in payload, using fallback", { data });
      return "[Missing name / title] Untitled";
    })();
    
    const run = await exampleWorkflow.createRunAsync();
    return await run.start({ 
      inputData: { 
        message: title,
        // Or pass the entire payload if your workflow needs it
        // ...triggerInfo.payload
      } 
    });
  }
}),
```

Done! Your webhook handler is now registered. See the [Inngest + Mastra Integration Guide](./dev-prod-replit.md) for details on how webhooks flow through the system and how to test them.

## Key Principles

**1. Fall back loudly:** Log when fields are missing so you can fix the integration

```typescript
const id = payload?.data?.id || (() => {
  logger?.warn("Missing ID in payload, generating one", { payload });
  return Date.now();
})();
```

**2. Log everything:** Capture full payloads to understand what you're receiving

```typescript
logger?.info("📥 Webhook received", { payload });
```

**3. Keep it simple:** Don't validate webhook signatures or authenticate senders - focus on processing

**4. Always try:** Wrap in try/catch and return 500 on error, but attempt to process any data without providing mocked data - make it obvious when fallbacks are used

## Detailed Guide

### Step 1: Find Webhook Documentation

Find sample payloads in your connector's docs:

- **Linear**: <https://developers.linear.app/docs/graphql/webhooks>
- **GitHub**: <https://docs.github.com/en/webhooks>
- **Stripe**: <https://stripe.com/docs/webhooks>

### Step 2: Create the Trigger File

Create `src/triggers/{connectorName}Triggers.ts`:

```typescript
import { registerApiRoute } from "../mastra/inngest";

export function register{Connector}Trigger({ triggerType, handler }) {
  return [
    registerApiRoute("/{connector}/webhook", {
      method: "POST",
      handler: async (c) => {
        const mastra = c.get("mastra");
        const logger = mastra?.getLogger();

        try {
          const payload = await c.req.json();
          logger?.info("📥 [{Connector}] Webhook received", { payload });

          // Only process events you care about (optional)
          if (payload.action !== "created" && payload.action !== "updated") {
            logger?.info("[{Connector}] Skipping event", { action: payload.action });
            return c.json({ success: true, skipped: true });
          }

          // Pass the entire payload - let the consumer pick what they need
          const triggerInfo = { type: triggerType, payload };

          const result = await handler(mastra, triggerInfo);
          return c.json({ success: true, result });
        } catch (error) {
          logger?.error("❌ [{Connector}] Error", { error });
          return c.json({ success: false, error: String(error) }, 500);
        }
      },
    }),
  ];
}
```

### Step 3: Register in `src/mastra/index.ts`

```typescript
import { register{Connector}Trigger } from "../triggers/{connector}Triggers";
import { exampleWorkflow } from "./workflows/exampleWorkflow";

// In server > apiRoutes array:
...register{Connector}Trigger({
  triggerType: "{connector}/{event}",
  handler: async (mastra, triggerInfo) => {
    const logger = mastra?.getLogger();
    
    // Extract what you need from the full payload
    const data = triggerInfo.payload?.data || {};
    
    // Fall back loudly - log when using defaults
    const title = data.title || data.name || (() => {
      logger?.warn("[{Connector}] No title/name found, using default", { data });
      return "[Missing name / title] Untitled";
    })();
    
    const run = await exampleWorkflow.createRunAsync();
    return await run.start({
      inputData: { message: title }
    });
  }
}),
```

## Tips

**Same name everywhere:** Use `{connector}` consistently in paths, event types, and file names

**Fall back loudly:** When using fallbacks, always log what's missing:

```typescript
const value = payload?.field || (() => {
  logger?.warn("Missing field, using default", { payload });
  return "[Missing field] default-value";
})();
```

**Log the payload:** `logger?.info("Webhook received", { payload })`

**Filter to events you want:** Only process specific actions (e.g., `created`, `updated`), skip the rest

**Don't validate senders:** Focus on processing, not authentication

## Examples

See these files for complete examples:

- `exampleConnectorTrigger.ts` - Linear webhook handler (comprehensive example)
- `slackTriggers.ts` - Slack webhook handler
- `telegramTriggers.ts` - Telegram webhook handler

## Architecture Notes

The `registerApiRoute` function creates:

1. A webhook handler at `/{connector}/webhook`
2. An Inngest forwarding function that ensures reliability through retries

The connector name is extracted from the **first path segment** of your route:

- `/linear/webhook` → connector name: "linear" → listens for: `event/api.webhooks.linear.action`
- `/github/webhook` → connector name: "github" → listens for: `event/api.webhooks.github.action`

**Special Case - Slack/Telegram:**
Slack and Telegram use paths like `/webhooks/slack/action` and `/webhooks/telegram/action`, where the first segment is "webhooks". This means:

- Both connectors share the event name: `event/api.webhooks.webhooks.action`
- Both share the function ID: `api-webhooks`
- When testing, you must send the "webhooks" event name for both providers

This shared event name doesn't cause conflicts because each handler still validates its own specific payload structure internally. NOTE: This **only** applies to Slack and Telegram.

In production, webhooks flow through Replit's infrastructure and Inngest Cloud before reaching your handler. See the [Inngest + Mastra Integration Guide](./dev-prod-replit.md) for complete architectural details and testing instructions.

## Troubleshooting

### Webhook handler not triggered

- Check that both servers are running in development (see Integration Guide)
- Verify the webhook is registered in `src/mastra/index.ts`
- Check Inngest dashboard for event processing

### Missing fields in payload

- Check your logs for warnings about missing fields
- Compare logged payload with connector documentation
- Update field extraction to match actual payload structure

### Workflow not starting

- Verify workflow is imported and registered
- Check that inputData matches workflow's inputSchema
- Review logs for validation errors

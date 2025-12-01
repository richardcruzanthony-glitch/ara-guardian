# Time-Based Triggers

Create scheduled automations that trigger Mastra workflows on a recurring schedule using cron expressions.

**NOTE:** This document describes how dev/prod runs the full routing.  The agent may need to know how to directly query the Mastra server to run agents, workflows, etc.  You should disregard this documentation in that case and consult the Mastra doc (docs/mastra/**).

## Quick Start

**2 steps to add a time-based trigger:**

### 1. Import and call `registerCronTrigger` in `src/mastra/index.ts`

Add this **before** the Mastra initialization:

```typescript
import { registerCronTrigger } from "../triggers/cronTriggers";
import { myWorkflow } from "./workflows/myWorkflow";

// Register BEFORE the Mastra initialization
registerCronTrigger({
  cronExpression: "0 9 * * *", // Every day at 9 AM
  workflow: myWorkflow
});

// Then the Mastra initialization
export const mastra = new Mastra({
  // ...
});
```

### 2. Make sure your workflow has an empty input schema

Time-based workflows don't receive external input, so use an empty schema:

```typescript
export const myWorkflow = createWorkflow({
  id: "daily-report-workflow",
  
  // Empty input schema for time-based triggers
  inputSchema: z.object({}) as any,
  
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
})
  .then(generateReport)
  .then(sendNotification)
  .commit();
```

Done! Your workflow will now run on schedule.

**Important:** Unlike webhook triggers, do NOT spread `registerCronTrigger()` into the `apiRoutes` array. Cron triggers don't create HTTP endpoints, so you simply call the function directly as shown above. The function registers the trigger internally and returns an empty array.

## Key Differences from Webhook Triggers

Time-based triggers work differently from webhook triggers:

| Aspect | Time-Based (Cron) | Webhook-Based |
|--------|-------------------|---------------|
| **Registration** | Call `registerCronTrigger()` directly | Spread into `apiRoutes`: `...registerSlackTrigger()` |
| **Location** | Before Mastra initialization | Inside `apiRoutes` array |
| **Returns** | Empty array `[]` | Array with API route config |
| **Creates endpoint** | No | Yes (e.g., `/slack/webhook`) |
| **Trigger source** | Schedule (cron) | External HTTP request |

**Example - Time-Based (DO THIS):**

```typescript
// Just call it directly, no spreading
registerCronTrigger({
  cronExpression: "0 9 * * *",
  workflow: myWorkflow
});
```

**Example - Webhook-Based (DON'T DO THIS for cron):**

```typescript
// DON'T spread registerCronTrigger into apiRoutes
// This is only for webhook triggers
apiRoutes: [
  ...registerSlackTrigger({ ... }), // ✅ Correct for webhooks
  ...registerCronTrigger({ ... }),  // ❌ Wrong! Don't do this
]
```

## Common Cron Expressions

```typescript
// Every minute (testing only)
"* * * * *"

// Every 5 minutes
"*/5 * * * *"

// Every hour at minute 0
"0 * * * *"

// Every day at 9 AM
"0 9 * * *"

// Every day at 6 PM
"0 18 * * *"

// Every Monday at 9 AM
"0 9 * * 1"

// Every weekday (Mon-Fri) at 9 AM
"0 9 * * 1-5"

// First day of every month at midnight
"0 0 1 * *"

// Every Sunday at 8 AM
"0 8 * * 0"

// Twice daily: 9 AM and 6 PM
"0 9,18 * * *"
```

**Cron Format:** `minute hour day-of-month month day-of-week`

## Complete Example

### Step 1: Create Your Workflow

`src/mastra/workflows/dailyReportWorkflow.ts`:

```typescript
import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";

const generateReport = createStep({
  id: "generate-report",
  description: "Generates daily analytics report",
  
  inputSchema: z.object({}),
  
  outputSchema: z.object({
    reportData: z.string(),
    timestamp: z.string(),
  }),
  
  execute: async ({ mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📊 Generating daily report...");
    
    // Your report generation logic here
    const reportData = "Daily metrics: ...";
    
    return {
      reportData,
      timestamp: new Date().toISOString(),
    };
  },
});

const sendNotification = createStep({
  id: "send-notification",
  description: "Sends the report via email or Slack",
  
  inputSchema: z.object({
    reportData: z.string(),
    timestamp: z.string(),
  }),
  
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📧 Sending report notification...");
    
    // Your notification logic here
    // e.g., send email, post to Slack, etc.
    
    return {
      success: true,
      message: "Report sent successfully",
    };
  },
});

export const dailyReportWorkflow = createWorkflow({
  id: "daily-report-workflow",
  
  // Empty input schema for time-based triggers
  inputSchema: z.object({}) as any,
  
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
})
  .then(generateReport)
  .then(sendNotification)
  .commit();
```

### Step 2: Register in `src/mastra/index.ts`

```typescript
import { registerCronTrigger } from "../triggers/cronTriggers";
import { dailyReportWorkflow } from "./workflows/dailyReportWorkflow";

// Register the cron trigger BEFORE Mastra initialization
registerCronTrigger({
  cronExpression: "0 9 * * *", // Every day at 9 AM
  workflow: dailyReportWorkflow
});

// Import your workflow for registration
export const mastra = new Mastra({
  workflows: {
    dailyReportWorkflow, // Register the workflow
  },
  // ... rest of config
});
```

## Testing Your Time-Based Trigger

### 1. Test with a short interval

For testing, use a frequent cron expression:

```typescript
// Run every minute (for testing only)
registerCronTrigger({
  cronExpression: "* * * * *",
  workflow: myWorkflow
});
```

### 2. Check the logs

Both servers should be running:

- Mastra dev server (port 5000)
- Inngest dev server (port 3000)

Watch the logs for execution:

```text
🕐 [registerCronWorkflow] Registering cron trigger
🚀 [Cron Trigger] Starting scheduled workflow execution
📝 [Cron Trigger] Workflow run created
✅ [Cron Trigger] Workflow completed successfully
```

### 3. Monitor in Inngest Dashboard

Visit `http://localhost:3000` to see:

- When the workflow ran
- Step-by-step execution
- Any errors or retries

### 4. Manual testing

Trigger the workflow manually via the Mastra Playground or API:

```bash
# Via Mastra API
curl -X POST http://localhost:5000/api/workflows/daily-report-workflow/run \
  -H "Content-Type: application/json" \
  -d '{"inputData": {}}'
```

## Key Principles

**1. Empty input schema:** Time-based workflows don't receive external input

```typescript
inputSchema: z.object({}) as any
```

**2. Register before Mastra initialization:** The cron trigger must be registered before `new Mastra({})`

**3. One trigger per automation:** An automation should only have one trigger (either cron OR webhook, not both)

**4. Don't spread into apiRoutes:** Call `registerCronTrigger()` directly. Unlike webhook triggers, do NOT use the spread operator (`...`) or add it to the `apiRoutes` array

**5. Register only once:** Call `registerCronTrigger()` only one time for your automation. Multiple calls will register multiple triggers, which is not supported

**6. Test with frequent intervals:** Use `* * * * *` (every minute) for testing, then change to your desired schedule

## Architecture Notes

The `registerCronTrigger` function:

1. Creates an Inngest function that listens to both:
   - A custom event (`replit/cron.trigger`)
   - A cron schedule (your expression)
2. Executes your workflow when the schedule fires
3. Provides automatic retries and durability through Inngest

In production, Inngest Cloud manages the scheduling and ensures reliable execution.

## Troubleshooting

### Cron trigger not firing

- Verify both servers are running (Mastra on 5000, Inngest on 3000)
- Check that `registerCronTrigger` is called BEFORE `new Mastra({})`
- Look for the registration log: `🕐 [registerCronWorkflow] Registering cron trigger`

### Workflow not registered

- Ensure your workflow is imported and added to the `workflows` object in Mastra initialization
- Check for any import errors in the logs
- Verify the workflow ID matches what you expect

### Wrong schedule

- Use <https://crontab.guru> to validate your cron expression
- Remember: cron uses UTC time in production
- Test with `* * * * *` (every minute) first

## Moving to Production

### Update cron expression

Change from testing interval to production schedule:

```typescript
// Development: every minute for testing
// cronExpression: "* * * * *"

// Production: every day at 9 AM UTC
cronExpression: "0 9 * * *"
```

### Consider timezone

Cron expressions use UTC. If you need a specific timezone:

- Convert your desired time to UTC
- Example: 9 AM Pacific (UTC-8) = 5 PM UTC (17:00)
- Use: `"0 17 * * *"`

## Examples

See these files for complete examples:

- `src/mastra/workflows/exampleWorkflow.ts` - Example workflow structure
- `src/triggers/cronTriggers.ts` - Registration implementation

## Webhook Triggers

For event-driven automations (Slack messages, GitHub events, etc.), see [Connector Webhook Triggers](./webhook_connector_triggers.md).

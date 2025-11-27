# Inngest + Mastra Integration Guide

This document explains:

1. How Mastra and Inngest integrate together
2. The difference between dev/prod environments for webhook-triggered workflows
3. How to test workflows locally
4. The complete production webhook flow architecture

**NOTE:** This document describes how dev/prod runs the full routing.  The agent may need to know how to query the Mastra server to run directly agents, workflows, etc.  You should disregard this documentation in that case and consult the Mastra doc (docs/mastra/**).

---

## 1. CORE CONCEPTS

### Two Critical Endpoints

Your Mastra application exposes **two distinct Inngest endpoints**:

1. **`/api/inngest`** - The Inngest orchestration endpoint
   - WHERE: Inngest Cloud (or dev server) calls this to execute workflow steps
   - WHAT: Registered by `inngestServe` in `src/mastra/index.ts`
   - WHEN: Called by Inngest to orchestrate each step of your workflow

2. **`/{connector}/webhook`** - Webhook receiver endpoints (e.g., `/linear/webhook`)
   - WHERE: Your forwarding function calls this to trigger workflows
   - WHAT: Registered by `registerApiRoute` in your trigger files
   - WHEN: Receives webhook payloads and starts workflow execution

### How `registerApiRoute` Works

When you call `registerApiRoute("/linear/webhook", {...})`:

1. **Creates a webhook handler** at `/linear/webhook` that validates and processes payloads
2. **Creates an Inngest function** with ID `api-linear` that:
   - Listens for `event/api.webhooks.linear.action` events
   - Contains a step called "forward request to Mastra"
   - Forwards the request to `http://localhost:5000/linear/webhook`

This dual registration ensures webhook reliability through Inngest's retry and durability features.

**Special Case - Slack/Telegram:**
Slack and Telegram use paths like `/webhooks/slack/action` and `/webhooks/telegram/action`. Because `registerApiRoute` extracts the connector name from the first path segment, both resolve to the connector name "webhooks" instead of "slack" or "telegram". This means:

- Both listen for: `event/api.webhooks.webhooks.action` (shared event name)
- Function IDs: `api-webhooks` (same for both)
- Test scripts must send `event/api.webhooks.webhooks.action` for Slack/Telegram

---

## 2. DEVELOPMENT SETUP

When you run your application locally, you need **two servers**:

```bash
# Terminal 1: Mastra server (via "Start application" workflow)
npm start  # → localhost:5000

# Terminal 2: Inngest dev server (via "Start inngest server" workflow)
inngest dev -u http://localhost:5000/api/inngest --port 3000
# → localhost:3000 (orchestrator and a web UI)
```

NOTE: The Replit agent can only do this by running the Replit Workflows with the restart_workflow tool for both.

### How Webhooks Flow in DEV

**Via Webhook Testing:**

External Webhook          Mastra Container         Dev Inngest              Mastra Container
(e.g., Linear)           localhost:5000           localhost:3000           localhost:5000
────────────────         ───────────────          ───────────────          ───────────────

POST /linear/webhook ──► Handler receives
                         Validates payload
                         Calls workflow.start() ────────────────────────────────┐
                                                                                │
                                                  Registers execution ◄─────────┘
                                                  Orchestrator (RAM)
                                                       │
                                                       │ Step 1 request
                                                       ├──────────────────► /api/inngest
                                                       │                    Execute Step 1
                                                       │◄─────────────────── Returns result
                                                       │ (Stores in RAM)
                                                       │
                                                       │ Step 2 request
                                                       ├──────────────────► /api/inngest
                                                       │                    Execute Step 2
                                                       │◄─────────────────── Returns result
                                                       │
                                                       ▼
                                                  View in UI: Replit Playground

**Key Points:**

- Inngest dev server = temporary coordinator (stores everything in RAM)
- Nothing persists after restart
- Mastra Workflows are triggered by calling `workflow.start()` directly or via webhooks
- Both methods go through the same Inngest orchestration flow

---

## 3. PRODUCTION SETUP

**Important:** You **never** deploy yourself. The Replit Publish wizard handles all deployment configuration automatically. This section explains what happens behind the scenes so you can understand the production architecture.

**What Runs in Production:**

```bash
# Deployed via: NODE_ENV=production node .mastra/output/index.mjs
# No inngest dev server needed!
# Replit automatically registers your app with Inngest Cloud (api.inngest.com)
```

### Complete Production Webhook Flow

**Step-by-Step Production Architecture:**

1. External webhook arrives
   Linear servers → Replit Webhook Service (Replit infrastructure)
2. Replit transforms to Inngest event
   Replit Webhook Service converts webhook to:
   event/api.webhooks.linear.action → sends to api.inngest.com
3. Inngest receives event
   Inngest Cloud looks up functions triggered by this event
   Finds the forwarding function (id: "api-linear")
4. Inngest executes forwarding function
   Inngest Cloud → Your Container
   HTTP POST to your-domain/api/inngest
   Requests execution of step "forward request to Mastra"
5. Container forwards to webhook handler
   Your Container executes:
   fetch(`http://localhost:5000/{provider}/webhook`) with original payload
6. Webhook handler validates and starts workflow
   /linear/webhook endpoint:
   - Validates payload (checks action, type, data)
   - Calls workflow, e.g.`linearCreateIssueWorkflow.createRunAsync().start({inputData})`
7. Workflow start signals Inngest
   Your Container → Inngest Cloud
   Tells Inngest to orchestrate this workflow execution
8. Inngest orchestrates Step 1
   Inngest Cloud → Your Container
   HTTP POST to https://{your-domain}/api/inngest requesting Step 1
9. Container executes Step 1
   Your Container runs step code, returns result
10. Inngest memoizes and schedules Step 2
    Inngest Cloud stores Step 1 result in Postgres
    Determines Step 2 is next
11. Inngest orchestrates Step 2
    Inngest Cloud → Your Container
    HTTP POST to https://{your-domain}/api/inngest
    Includes Step 1 results + Step 2 request
12. Container executes Step 2
    Step 2 runs with Step 1's results available
13. Workflow completes
    Inngest Cloud persists final state
    Workflow marked complete in Postgres

**Visual Flow Diagram:**

External Webhook     Replit Service        Inngest Cloud         Your Container
────────────────     ──────────────        ─────────────         ──────────────

POST /webhook    ──► Transforms to
                     inngest event     ──► api.inngest.com
                                           Finds function
                                           "api-linear"
                                                │
                                                │ Execute forwarding step
                                                ├──────────────────► https://{your-domain}
                                                │                    /api/inngest
                                                │                    (forward to /linear/webhook)
                                                │◄──────────────────
                                                │
                     ◄──────────────────────────┤
                     /linear/webhook receives   │
                     Validates payload          │
                     Calls workflow.start() ────┤
                                                │
                                                │ Register execution
                                                │ Orchestrate steps:
                                                │
                                                │ Step 1
                                                ├──────────────────► /api/inngest
                                                │                    Execute Step 1
                                                │◄────────────────── Result
                                                │ (Save to Postgres)
                                                │
                                                │ Step 2
                                                ├──────────────────► /api/inngest
                                                │                    Execute Step 2
                                                │◄────────────────── Result
                                                │
                                                ▼
                                           Complete
                                           (View at app.inngest.com)

**Key Insight:** The `/api/inngest` endpoint serves two purposes:

1. Executes the forwarding function (which calls `/linear/webhook`, which then calls `workflow.start()` to signal Inngest to orchestrate workflow steps).
2. Receives workflow step execution requests (to run your actual workflow steps).

---

## 4. DEV vs PROD DIFFERENCES

| Aspect | Development | Production |
|--------|-------------|------------|
| **Inngest runs on** | localhost:3000 (dev server) | api.inngest.com (cloud) |
| **Webhook transformation** | Direct (no Replit layer) | Via Replit Webhook Service |
| **Event pattern** | Direct calls to `/linear/webhook` | `event/api.webhooks.linear.action` |
| **Storage** | RAM (lost on restart) | Postgres (durable) |
| **Inngest dev server needed?** | ✅ YES (run manually) | ❌ NO (handled by Publish) |
| **Web UI** | localhost:3000 | app.inngest.com |
| **Authentication** | None | Auto-configured by Replit |
| **Trigger methods** | `workflow.start()` or webhooks | Same - both methods work |
| **Retry behavior** | 0 retries (fast debugging) | 3 retries (production reliability) |

Your code = IDENTICAL in both environments.

The Mastra + Inngest SDK automatically detects the environment:

- **Dev:** Sees dev server at localhost:3000 → uses it for orchestration
- **Prod:** No dev server → uses api.inngest.com for orchestration

---

## 5. Testing the whole system (make it prod ready)

### The ONLY Valid Test Method - Production Flow Simulation

**CRITICAL:** You must test the complete production event flow to validate your integration using a test script. This is the exact flow that happens in production (using dev Inngest server instead of Inngest Cloud).

Example:

```typescript
import { inngest } from "./src/mastra/inngest/client";

/**
 * This sends the EXACT event that Replit Webhook Service sends to Inngest Cloud.
 * It exercises the complete production flow:
 * 1. Inngest receives event/api.webhooks.{provider}.action
 * 2. Triggers the forwarding function (created by registerApiRoute)
 * 3. Forwarding function POSTs to /{provider}/webhook
 * 4. Webhook handler validates and starts workflow
 * 5. Inngest orchestrates step-by-step execution
 */
// Configuration
const provider = "linear";  // The webhook provider (e.g., "linear", "github", "stripe")

// Mock webhook payload - replace with your connector/name's schema. Keep it obviously mocked.
const mockWebhookPayload = {
  action: "create",
  type: "Issue",
  data: {
    id: "mock-issue-999",
    title: "MOCK: Test Issue Title",
    description: "MOCK: This is fake test data for validation",
    number: 999,
    priority: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  createdAt: "2025-01-01T00:00:00Z",
  organizationId: "mock-org-123"
};

/**
 * This sends the EXACT event that Replit Webhook Service sends to Inngest Cloud.
 * It exercises the complete production flow.
 * 
 * SPECIAL CASE: Slack and Telegram use /webhooks/{provider}/action paths,
 * so they both listen for "event/api.webhooks.webhooks.action" instead.
 */
// Determine the correct event name
let eventName: string;
if (provider === "slack" || provider === "telegram") {
  eventName = "event/api.webhooks.webhooks.action";
} else {
  eventName = `event/api.webhooks.${provider}.action`;
}

await inngest.send({
  name: eventName,  // Must match what registerApiRoute creates
  data: {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(mockWebhookPayload)
  }
});

console.log(`✅ Event sent for ${provider}! Check execution at: http://localhost:3000`);
```

Run with:

```bash
npx tsx <test-file-name>
```

### What This Tests (Complete Production Flow)

This is the ONLY test method that validates:

- ✅ Inngest event routing (`event/api.webhooks.linear.action`)
- ✅ The forwarding function created by `registerApiRoute`
- ✅ HTTP forwarding to `/linear/webhook`
- ✅ Webhook payload parsing and validation
- ✅ Handler validation logic (action === "create", type === "Issue")
- ✅ Workflow triggering via `workflow.start()`
- ✅ Complete Inngest step-by-step orchestration
- ✅ All error handling and retry logic

### Verification Steps

After running the test, check the console. We must add a lot of logging statements, so we should have a robust logging system.

### Why Other Methods Don't Work

**❌ DON'T USE: Direct POST to `/linear/webhook`**

```bash
# This SKIPS the Inngest forwarding function
curl -X POST http://localhost:5000/linear/webhook ...
```

This bypasses the `registerApiRoute` Inngest function, so you're not testing the production flow.

❌ DON'T USE: Direct workflow execution

```typescript
// This SKIPS webhook validation and event routing
const run = await linearIssueWorkflow.createRunAsync();
await run.start({ inputData: {...} });
```

This skips the webhook handler validation logic and the Inngest event system.

✅ ONLY USE: The Inngest event send pattern shown above

This is the ONLY method that tests the complete production architecture from end-to-end.

---

## 6. TROUBLESHOOTING

### Common Issues

**Workflow doesn't start:**

- ✅ Check both servers are running (`npm start` + `inngest dev`)
- ✅ Verify workflow is registered in `src/mastra/index.ts`
- ✅ Check inputData matches the workflow's inputSchema
- ✅ Look for validation errors in console logs

**Webhook returns 500 error:**

- ✅ Verify payload structure matches expected format
- ✅ Check webhook handler validation logic (action/type checks)
- ✅ Review error logs in the "Start application" workflow

**Steps fail with schema errors:**

- ✅ Ensure outputSchema of step N matches inputSchema of step N+1
- ✅ Check that all required fields are returned from each step
- ✅ Review Inngest UI at localhost:3000 for detailed error messages

**Changes not reflected:**

- ✅ Restart both "Start application" and "Start inngest server" workflows
- ✅ Clear Inngest dev server cache: Stop and restart "Start inngest server"

### Debug Mode

Enable detailed logging:

```typescript
// In src/mastra/index.ts, change logger level:
logger: new PinoLogger({
  name: "Mastra",
  level: "debug", // Changed from "info"
}),
```

This logs all requests, step executions, and data transformations.

## Summary

**Development:**

- Two servers: Mastra (5000) + Inngest Dev (3000)
- Test with direct `workflow.start()` or webhook simulation
- Fast iteration, no persistence

**Production:**

- Single container running Mastra
- Webhooks flow: External → Replit Service → Inngest Cloud → Your Container
- Durable execution with Postgres storage
- Automatic retries and monitoring

**Key Architecture:**

- `/api/inngest` - Inngest's orchestration endpoint (handles step execution + forwarding)
- `/{connector}/webhook` - Your webhook receivers (validate & trigger workflows)
- `registerApiRoute` creates both the handler AND the Inngest forwarding function

Your Mastra workflows work identically in both environments, with Inngest handling all the complexity of orchestration, retries, and state management.

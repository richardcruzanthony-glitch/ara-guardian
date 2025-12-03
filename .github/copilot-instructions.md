# Ara Guardian - AI Agent Development Guide

## Project Overview

**Ara Guardian** is a self-evolving AI agent platform built on **Mastra** framework, deployed to Render. The system combines LLM-powered agents with persistent memory, real-time triggers (Telegram, Slack, Cron, Webhooks), and a philosophy of continuous learning from user corrections.

Core principle: **Telemetry is permanently disabled** across all configurations (Iron Mode).

## Architecture

### Directory Structure
```
src/
├── mastra/
│   ├── index.ts              # Main Mastra instance, telemetry off, single agent enforcement
│   ├── agents/               # AI agents with memory & tools
│   ├── tools/                # Reusable agent capabilities
│   │   ├── brainEngine.ts    # Long-term memory system (us-complete.txt)
│   │   ├── adjuster.ts       # Self-correction & permanent learning
│   │   ├── autoPostTool.ts   # Classified ad generation & multi-site posting
│   │   ├── guardianQuoteTool.ts  # Material pricing & quoting system
│   │   └── skillInstaller.ts # Dynamic capability expansion
│   ├── inngest/              # Background job orchestration
│   └── storage/              # Persistent data (Postgres, file-based)
├── triggers/
│   ├── telegramTriggers.ts   # Telegram bot integration (polling mode)
│   ├── slackTriggers.ts      # Slack webhook handlers with SSE diagnostics
│   ├── cronTriggers.ts       # Scheduled tasks
│   └── dailyScrape.ts        # Automated web scraping for knowledge updates
└── telegramTriggers.ts       # Alternative webhook-based Telegram handler
```

### Key Components

**Mastra Instance** (`src/mastra/index.ts`):
- Single agent enforcement (`if (Object.keys(mastra.getAgents()).length > 1) throw`)
- Server on `0.0.0.0:${PORT || 5000}` for Render deployment
- Inngest integration for async workflows
- MCP server for tool exposure

**Memory System** (`brainEngine.ts`):
- Loads knowledge base from `us-complete.txt` (multiple search paths: `/opt/render/project/src/`, `public/`, `.mastra/output/`)
- Supports encryption (`ENCRYPTED:` prefix)
- Token-based indexing, association mapping, episodic memory
- Missing method: `decryptMemory()` is referenced but not implemented (line 116)

**Self-Correction** (`adjuster.ts`):
- Appends correction rules to `us-complete.txt`
- Uses **Deno** APIs (`Deno.readTextFile`, `Deno.writeTextFile`) - **incompatible with Node.js** runtime on Render
- Must be refactored to use Node.js `fs` module

## Critical Issues & Fixes Needed

### 1. **Module Resolution Errors**
**Problem**: `moduleResolution: "NodeNext"` requires explicit `.js` extensions in imports, even for `.ts` files.

**Fix Pattern**:
```typescript
// ❌ ERROR
import { exampleTool } from "../tools/exampleTool";

// ✅ CORRECT
import { exampleTool } from "../tools/exampleTool.js";
```

**Files to fix**:
- `src/mastra/agents/exampleAgent.ts` (lines 3-4)
- `src/triggers/cronTriggers.ts` (line 23)
- `src/triggers/exampleConnectorTrigger.ts` (line 16)
- `src/triggers/slackTriggers.ts` (line 24)

### 2. **Tool Execute Signature Mismatch**
**Problem**: Tools use destructured params `({ context, mastra })` instead of Mastra v0.20+ signature.

**Fix Pattern**:
```typescript
// ❌ OLD (breaks in v0.20+)
execute: async ({ context, mastra }) => {
  const logger = mastra?.getLogger();
  // ...
}

// ✅ NEW (v0.20+ compatible)
execute: async (context) => {
  const logger = context.mastra?.getLogger();
  // context.data contains the input parameters
  // ...
}
```

**Files to fix**:
- `src/mastra/tools/exampleTool.ts` (line 42)
- `src/mastra/tools/autoPostTool.ts` (lines 95, 148, 191)
- `src/mastra/tools/guardianQuoteTool.ts` (lines 167, 240)
- `src/mastra/tools/textMatchTool.ts` (line 133)

### 3. **Missing Telegram Dependency**
**Problem**: `src/telegramTriggers.ts` imports `node-telegram-bot-api` (not in `package.json`).

**Fix**: Either:
- Add dependency: `npm install node-telegram-bot-api @types/node-telegram-bot-api`
- OR remove `src/telegramTriggers.ts` and use only `src/triggers/telegramTriggers.ts` (webhook approach)

### 4. **Deno APIs in Node.js Runtime**
**Problem**: `adjuster.ts` and `skillInstaller.ts` use `Deno.*` APIs (not available in Node.js).

**Fix Pattern**:
```typescript
// ❌ Deno
const current = await Deno.readTextFile(memoryPath);
await Deno.writeTextFile(memoryPath, current + rule);

// ✅ Node.js
import fs from 'fs/promises';
const current = await fs.readFile(memoryPath, 'utf-8');
await fs.writeFile(memoryPath, current + rule);
```

### 5. **Mastra API Compatibility**
**Problems**:
- `src/mastra/index.ts` line 23: `inngest` property doesn't exist in Mastra config (use `workflows` or `server.inngest`)
- `src/mastra/storage/index.ts`: `FileStore` not exported from `@mastra/core/storage` (use `PostgresStorage` or custom)
- `src/triggers/dailyScrape.ts`: Global `mastra` not defined (import from `../mastra/index.js`)
- `src/telegramTriggers.ts` line 32: `agent.run()` should be `agent.generate()` or `agent.text()`

### 6. **Type Issues in Slack Triggers**
**Problem**: `DiagnosisStep` type doesn't have `error` property for `pending` status.

**Fix**: Change type definition or use conditional property access:
```typescript
// Option 1: Update type
type DiagnosisStep = 
  | { status: "pending"; name: string; extra?: Record<string, any> }
  | { status: "success" | "failed"; name: string; extra?: Record<string, any>; error?: string };

// Option 2: Safe access
steps.auth.status = "failed";
(steps.auth as any).error = "authentication failed"; // Cast for now
```

## Development Workflows

### Build & Deploy
```bash
npm install
npm run build          # Runs build-simple.js → npx tsc
npm start              # node dist/index.js
```

**Build Process** (`build-simple.js`):
1. Compiles TypeScript with `npx tsc`
2. Outputs to `dist/` directory
3. **No type checking bypass** - all errors must be fixed

### Local Development
```bash
npm run dev            # mastra dev (hot reload)
npm run check          # Type checking only
npm run format         # Prettier formatting
```

### Testing
```bash
# Test automation triggers
node tests/testCronAutomation.ts
node tests/testWebhookAutomation.ts

# Slack SSE diagnostics
curl http://localhost:5000/test/slack
```

## Conventions & Patterns

### Tool Creation
- Use `createTool()` from `@mastra/core/tools`
- Always define `inputSchema` and `outputSchema` with Zod
- Access mastra instance via `context.mastra` (not destructured)
- Use `context.data` for input parameters
- Return objects matching `outputSchema`

### Agent Configuration
- **Single agent per deployment** (enforced in `src/mastra/index.ts`)
- LLM setup: Support both Replit AI Integrations (`AI_INTEGRATIONS_*`) and standard OpenAI
- Memory: Use `@mastra/memory` with Postgres storage (`sharedPostgresStorage`)
- Tools: Register via agent `tools` array

### Triggers
- **Telegram**: Polling mode (`node-telegram-bot-api`) OR webhook mode (`/webhooks/telegram/action`)
- **Slack**: Webhook handlers with SSE diagnostics at `/test/slack`
- **Cron**: Use `@mastra/inngest` for scheduling
- **Webhooks**: Register via `registerApiRoute()` in trigger files

### Memory & Learning
- **Knowledge base**: `us-complete.txt` (searched in multiple locations)
- **Self-correction**: Append rules via `adjuster` tool (needs Node.js fix)
- **Encryption**: Optional `ENCRYPTED:` prefix in memory file
- **Brain Engine**: Token indexing, associations, episodic memory, inference rules

### Environment Variables
```bash
PORT=5000                                    # Server port (Render assigns dynamically)
MASTRA_TELEMETRY_ENABLED=false               # Always false
BOT_TOKEN=...                                # Telegram bot token
AI_INTEGRATIONS_OPENAI_BASE_URL=...          # Replit AI (optional)
AI_INTEGRATIONS_OPENAI_API_KEY=...           # Replit AI (optional)
OPENAI_API_KEY=...                           # Standard OpenAI (fallback)
DATABASE_URL=postgresql://...                # Postgres for memory storage
```

## Common Gotchas

1. **Import Extensions**: Always use `.js` extension in imports, even for `.ts` files
2. **Tool Signatures**: Use `execute: async (context)` not `({ context, mastra })`
3. **Mastra Version**: API changed significantly in v0.20.0 - check migration docs
4. **Render Paths**: Memory file is at `/opt/render/project/src/us-complete.txt` in production
5. **Telemetry**: Disable everywhere (`process.env.MASTRA_TELEMETRY_ENABLED = "false"`)
6. **Agent Limit**: Only 1 agent allowed per deployment (hard-coded check)
7. **Deno Runtime**: Not supported - refactor any Deno APIs to Node.js equivalents

## Next Steps for AI Agents

When working on this codebase:
1. **Fix import paths** with `.js` extensions first (blockers for all files)
2. **Update tool signatures** to match Mastra v0.20+ API
3. **Refactor Deno code** in `adjuster.ts` and `skillInstaller.ts` to Node.js `fs` module
4. **Resolve Telegram** integration - choose polling OR webhook approach, install missing deps
5. **Update Mastra config** - remove invalid `inngest` property, fix storage provider
6. **Test triggers** - ensure Slack SSE, Telegram, cron handlers work after fixes
7. **Verify deployment** - check Render build logs, test `/test/slack` endpoint

## Resources

- Mastra Docs: `docs/mastra/` (00-getting-started through 07-migration)
- Trigger Patterns: `docs/triggers/` (webhook, cron, dev-prod guides)
- Example Agent: `src/mastra/agents/exampleAgent.ts` (reference implementation)
- Example Tool: `src/mastra/tools/exampleTool.ts` (tool structure template)

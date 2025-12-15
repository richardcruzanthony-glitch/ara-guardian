## Ara Guardian • AI Agent Quickstart

1. **Mission & Guardrails**  
  - Telemetry is permanently disabled (`process.env.MASTRA_TELEMETRY_ENABLED = "false"`).  
  - Exactly one agent is allowed; `src/mastra/index.ts` hard-throws if more than one is registered.  
  - All runs must operate with Iron Mode assumptions (no analytics, no hidden tool enablement).

2. **System Topology**  
  - `src/mastra/index.ts`: boots Mastra, registers tools, exposes MCP + disabled triggers, hosts HTTP server with embedded HTML chat UI and /chat API.  
  - Agents live in `src/mastra/agents/`; `exampleAgent.ts` shows mandated AI SDK v4 syntax and instructions patterns.  
  - Tools under `src/mastra/tools/` wire custom capabilities (brainEngine memory, guardianPricing, grokReasoning, scraper, skillInstaller, adjuster).  
  - Triggers under `src/triggers/` connect Slack, Telegram, cron, daily scrape; currently stubbed due to Mastra v0.20+ API changes.  
  - Knowledge base is `us-complete.txt` (root + `public/`) and is loaded by `brainEngine.ts` with encryption-aware parsing.

3. **Developer Workflow**  
  - Install/build: `npm install`, `npm run build` (runs `build-simple.js` → `tsc` into `dist/`).  
  - Local dev: `npm run dev` (mastra dev server), `npm run check`, `npm run format`.  
  - Start prod bundle: `npm start` → `node dist/index.js` (on Windows set `cross-env` or run `$env:NODE_ENV='production'; node dist/index.js`).  
  - Manual tests: `node tests/testCronAutomation.ts`, `node tests/testWebhookAutomation.ts`, `curl http://localhost:5000/test/slack` for SSE diagnostics.

4. **Code Conventions**  
  - TypeScript uses `moduleResolution: "NodeNext"`; every relative import must include `.js`.  
  - Mastra v0.20+ tool API: `execute: async (context) => { const logger = context.mastra?.getLogger(); const { input } = context.data; }`. Never destructure `{ context, mastra }`.  
  - Telemetry helpers (`src/mastra/telemetry*.ts`) remain disabled stubs—do not re-enable.  
  - When touching triggers, prefer `registerApiRoute` alternatives compatible with Hono or add explicit comments if a feature is intentionally stubbed (see Slack trigger).  
  - Any file previously using `Deno.*` (`adjuster.ts`, `skillInstaller.ts`) must use Node `fs/promises`.  
  - Agent instructions follow exposure-driven learning loop: Exposure → Reflection → Adjustment.

5. **Integration Contracts**  
  - LLM credentials: prefer OpenRouter (`OPENROUTER_API_KEY`), otherwise fall back to standard `OPENAI_API_KEY` + optional `OPENAI_BASE_URL`; Grok/xAI tooling (`grokReasoning`) requires `GROK_API_KEY`.  
  - Telegram/Slack triggers expect `BOT_TOKEN`/`SLACK_BOT_TOKEN` but are currently disabled (API incompatible).  
  - Memory backends: Postgres via `DATABASE_URL` (see `@mastra/memory` usage) or local file fallback (`us-complete.txt`).  
  - Render deploys bind host `0.0.0.0` and env `PORT`; never hard-code ports.  
  - `inngestServe` integrates background jobs; if you modify workflows ensure `inngest` export shape remains `{ serve }`.  
  - Chat API uses Bearer token auth; /learn command installs skills via `skillInstaller`.

6. **Common Pitfalls**  
  - Missing `.js` extensions or old tool signatures will break compilation immediately. Audit touched imports.  
  - `node-telegram-bot-api` is not installed; triggers use webhook stubs.  
  - Slack SSE diagnostics mutate `DiagnosisStep`; make sure the union type carries `error` only on failure states.  
  - Memory loader references `decryptMemory()`—implement or guard usage before enabling encrypted blobs.  
  - Render filesystem paths differ; production memory file resolves to `/opt/render/project/src/us-complete.txt`.

7. **When editing**  
  - Preserve Iron Mode messaging/comments; they signal non-negotiable requirements.  
  - Document new tools/triggers in this file plus `README.md`.  
  - Keep instructions for agents declarative (what, why, constraints). If adding memory, call out Postgres dependency.  
  - After significant changes, rerun `npm run build` to update `dist/` (Render deploy relies on it).  
  - Unsure about Mastra APIs? Cross-check `docs/mastra/07-migration/` before introducing new patterns.

Questions or gaps? Ping here so we can extend this guide.

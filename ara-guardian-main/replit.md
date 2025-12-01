# Overview

This is a Mastra-based agent automation system built for Replit. The project enables users to create AI-powered workflows and agents that can be triggered by time-based schedules (cron) or webhooks from external services like Telegram, Slack, Linear, and other third-party integrations.

The system uses Mastra's workflow engine for orchestrating multi-step AI operations, with Inngest providing durable execution and step-by-step resumability. This ensures that workflows can gracefully handle failures, suspend for human input, and resume from exactly where they left off.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Framework

**Mastra Framework**: The application is built on Mastra v0.20.0, a TypeScript-first framework for building AI applications and agents. Mastra provides the primitives for agents, tools, workflows, and memory management.

**TypeScript Configuration**: Uses ES2022 module system with bundler resolution, strict type checking enabled, and source files organized under `src/`.

**Node.js Runtime**: Requires Node.js >=20.9.0 for modern JavaScript features and performance.

## AI Model Integration

**Multi-Provider Support**: Integrates with multiple AI providers through standardized interfaces:
- OpenAI via `@ai-sdk/openai` and `openai` packages
- OpenRouter via `@openrouter/ai-sdk-provider`
- Anthropic support mentioned in examples
- Uses Vercel AI SDK v4.3.16 for model abstraction

**Model Routing**: The system can route between different AI models based on runtime context, user tier, or other dynamic factors.

## Workflow Engine Architecture

**Inngest Integration**: Uses Inngest for durable workflow execution with the following benefits:
- Step-by-step memoization - completed steps are never re-executed
- Automatic retries with configurable policies
- Suspend/resume capabilities for human-in-the-loop workflows
- Real-time monitoring and observability
- Event-driven execution model

**Workflow Structure**: Workflows are composed of:
- **Steps**: Individual units of work with defined input/output schemas (Zod validation)
- **Chaining**: Sequential execution with `.then()`
- **Parallel Execution**: Concurrent steps with `.parallel()`
- **Conditional Branching**: Dynamic routing based on step outputs
- **Data Mapping**: Transform outputs between steps using `.map()`

**Suspend/Resume Pattern**: Workflows can pause at any step, persist their state as snapshots, and resume later. This enables:
- Human approval workflows
- Rate limiting and throttling
- Waiting for external resources
- Multi-turn conversations

## Agent Architecture

**Agent Types**:
- **Single Agents**: Individual AI agents with specific instructions and tools
- **Agent Networks**: Routing agents that delegate to multiple sub-agents, workflows, or tools based on task analysis

**Agent Capabilities**:
- **Memory**: Thread-scoped and resource-scoped persistence using conversation history, semantic recall (RAG), and working memory
- **Tools**: Extensible function calling for APIs, databases, and custom logic
- **Streaming**: Real-time response generation with incremental output
- **Guardrails**: Input/output processors for content moderation and security

**Legacy Compatibility**: Uses `generateLegacy()` and `streamLegacy()` methods for backward compatibility with Replit Playground UI, which requires AI SDK v1 model format.

## Memory System

**Three-Tier Memory**:
1. **Conversation History**: Recent messages (default last 10, configurable)
2. **Semantic Recall**: Vector-based RAG search for finding relevant past context
3. **Working Memory**: Persistent structured data (Markdown or Zod schema) maintained across conversations

**Memory Scoping**:
- **Thread-scoped**: Memory isolated per conversation thread
- **Resource-scoped**: Memory shared across all threads for the same user/entity

**Storage Requirement**: Memory requires both `thread` and `resource` identifiers to persist data.

## Trigger System

**Two Primary Trigger Types**:

1. **Time-Based (Cron) Triggers**:
   - Registered via `registerCronTrigger()` before Mastra initialization
   - Uses standard cron expressions (5-field format)
   - Does not create HTTP endpoints
   - Workflows must have empty input schemas

2. **Webhook Triggers**:
   - Registered via `registerApiRoute()` spread into `apiRoutes` array
   - Creates HTTP endpoints (e.g., `/telegram/webhook`, `/linear/webhook`)
   - Receives external events and starts workflows
   - Supports providers: Telegram, Slack, Linear, GitHub, etc.

**Inngest Event Flow**: 
- Webhook triggers → Inngest events → Forwarding functions → HTTP handlers → Workflow execution
- Event naming: `event/api.webhooks.{provider}.action`

## Data Persistence

**Storage Adapters**: Pluggable storage system supporting:
- **LibSQL**: Local or remote SQLite with vector extensions (`@mastra/libsql`)
- **PostgreSQL**: Full-featured with pgvector support (`@mastra/pg`)
- **Upstash**: Redis and vector services for serverless deployments

**What Gets Persisted**:
- Conversation threads and messages
- Working memory (structured or freeform)
- Workflow snapshots for suspend/resume
- Vector embeddings for semantic recall
- Thread titles (auto-generated from first message)

## Logging and Observability

**Production Logger**: Custom `ProductionPinoLogger` extending `MastraLogger` with:
- Pino-based structured logging
- Configurable log levels (DEBUG, INFO, WARN, ERROR)
- ISO timestamp formatting
- JSON output for log aggregation

**Inngest Dashboard**: Real-time monitoring at `http://localhost:3000` during development showing:
- Workflow execution traces
- Step-by-step progress
- Retry attempts and failures
- Event routing and triggers

## Development Workflow

**CLI Tools**:
- `mastra dev`: Start development server with hot reload
- `mastra build`: Build for production deployment
- `inngest dev`: Start Inngest dev server for workflow orchestration
- TypeScript type checking and Prettier formatting

**Testing Pattern**: Manual test scripts in `tests/` directory for:
- Webhook automation testing (simulates external webhook events)
- Cron automation testing (simulates scheduled triggers)
- Direct Inngest event sending for fast feedback loops

# External Dependencies

## AI and LLM Services

**OpenAI**: Primary LLM provider requiring `OPENAI_API_KEY` environment variable. Used for text generation, embeddings, and tool calling across agents and workflows.

**OpenRouter**: Alternative LLM provider for accessing multiple models through a single API, configured via the OpenRouter AI SDK provider.

**Anthropic**: Supported for Claude models, requires `ANTHROPIC_API_KEY` in examples.

## Messaging and Communication APIs

**Telegram**: Bot integration via webhook triggers requiring:
- `TELEGRAM_BOT_TOKEN`: Bot authentication token
- Webhook endpoint at `/telegram/webhook`
- Supports message events and real-time responses

**Slack**: Workspace integration via `@slack/web-api` requiring:
- Slack app configuration with event subscriptions
- OAuth tokens for posting messages and accessing conversations
- Webhook endpoint for event routing

**WhatsApp**: Business API integration for chatbot functionality requiring:
- `WHATSAPP_VERIFY_TOKEN`: Webhook verification
- `WHATSAPP_ACCESS_TOKEN`: API authentication
- `WHATSAPP_BUSINESS_PHONE_NUMBER_ID`: Phone number identifier
- `WHATSAPP_API_VERSION`: API version (default v22.0)

## Workflow Orchestration

**Inngest**: Durable workflow execution platform providing:
- Event-driven function invocation
- Step memoization and automatic retries
- Real-time execution monitoring
- Suspend/resume capabilities
- Production deployment via Inngest Cloud
- Development server via `inngest-cli` package

**Inngest Realtime**: WebSocket-based real-time updates for workflow execution status via `@inngest/realtime` middleware.

## Database and Vector Storage

**PostgreSQL** (Optional): Relational database with vector search via pgvector extension. Requires `DATABASE_URL` connection string when using `@mastra/pg` storage adapter.

**LibSQL** (Optional): SQLite-compatible database with vector support. Can use local files (`file:database.db`) or remote Turso instances via `@mastra/libsql`.

**Upstash Redis** (Optional): Serverless Redis and vector database requiring:
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for conversation storage
- `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN` for semantic recall

## Search and Data APIs

**Exa**: Web search API via `exa-js` package for retrieving external data and research capabilities within workflows.

## Third-Party Connector Webhooks

**Linear**: Project management webhook integration for issue/project events requiring Linear webhook configuration.

**GitHub**: Repository event webhooks for CI/CD or automation triggers (referenced in documentation).

**Custom Connectors**: Extensible pattern for adding any webhook-based integration following the `registerApiRoute()` pattern in `src/triggers/`.

## Development and Build Tools

**TypeScript**: v5.9.3 with strict type checking and ES2022 module system.

**tsx**: TypeScript execution for running scripts and development server.

**Prettier**: Code formatting with `.ts` file support.

**dotenv**: Environment variable management via `.env` files.

**Zod**: v3.25.76 for runtime schema validation and type inference across all input/output schemas.
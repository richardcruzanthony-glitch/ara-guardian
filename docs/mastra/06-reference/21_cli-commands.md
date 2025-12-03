---
title: "Reference: CLI Commands"
description: Documentation for the Mastra CLI to develop, build, and start your project.
---

import { Callout } from "nextra/components";

# CLI Commands
[EN] Source: https://mastra.ai/en/reference/cli/mastra

You can use the Command-Line Interface (CLI) provided by Mastra to develop, build, and start your Mastra project.

## `mastra dev`

Starts a server which exposes a [local dev playground](/docs/server-db/local-dev-playground) and REST endpoints for your agents, tools, and workflows. You can visit [http://localhost:4111/swagger-ui](http://localhost:4111/swagger-ui) for an overview of all available endpoints once `mastra dev` is running.

You can also [configure the server](/docs/server-db/local-dev-playground#configuration).

### Flags

The command accepts [common flags][common-flags] and the following additional flags:

#### `--https`

Enable local HTTPS support. [Learn more](/docs/server-db/local-dev-playground#local-https).

#### `--inspect`

Start the development server in inspect mode, helpful for debugging. This can't be used together with `--inspect-brk`.

#### `--inspect-brk`

Start the development server in inspect mode and break at the beginning of the script. This can't be used together with `--inspect`.

#### `--custom-args`

Comma-separated list of custom arguments to pass to the development server. You can pass arguments to the Node.js process, e.g. `--experimental-transform-types`.

### Configs

You can set certain environment variables to modify the behavior of `mastra dev`.

#### Disable build caching

Set `MASTRA_DEV_NO_CACHE=1` to force a full rebuild rather than using the cached assets under `.mastra/`:

```bash copy
MASTRA_DEV_NO_CACHE=1 mastra dev
```

This helps when you are debugging bundler plugins or suspect stale output.

#### Limit parallelism

`MASTRA_CONCURRENCY` caps how many expensive operations run in parallel (primarily build and evaluation steps). For example:

```bash copy
MASTRA_CONCURRENCY=4 mastra dev
```

Leave it unset to let the CLI pick a sensible default for the machine.

#### Custom provider endpoints

When using providers supported by the Vercel AI SDK you can redirect requests through proxies or internal gateways by setting a base URL. For OpenAI:

```bash copy
OPENAI_API_KEY=<your-api-key> \
OPENAI_BASE_URL=https://openrouter.example/v1 \
mastra dev
```

For Anthropic:

```bash copy
ANTHROPIC_API_KEY=<your-api-key> \
ANTHROPIC_BASE_URL=https://anthropic.internal \
mastra dev
```

These are forwarded by the AI SDK and work with any `openai()` or `anthropic()` calls.

## `mastra build`

The `mastra build` command bundles your Mastra project into a production-ready Hono server. [Hono](https://hono.dev/) is a lightweight, type-safe web framework that makes it easy to deploy Mastra agents as HTTP endpoints with middleware support.

Under the hood Mastra's Rollup server locates your Mastra entry file and bundles it to a production-ready Hono server. During that bundling it tree-shakes your code and generates source maps for debugging.

The output in `.mastra` can be deployed to any cloud server using [`mastra start`](#mastra-start).

If you're deploying to a [serverless platform](/docs/deployment/serverless-platforms) you need to install the correct deployer in order to receive the correct output in `.mastra`.

It accepts [common flags][common-flags].

### Configs

You can set certain environment variables to modify the behavior of `mastra build`.

#### Limit parallelism

For CI or when running in resource constrained environments you can cap how many expensive tasks run at once by setting `MASTRA_CONCURRENCY`.

```bash copy
MASTRA_CONCURRENCY=2 mastra build
```

## `mastra start`

<Callout type="info">
You need to run `mastra build` before using `mastra start`.
</Callout>

Starts a local server to serve your built Mastra application in production mode. By default, [OTEL Tracing](/docs/observability/otel-tracing) is enabled.

### Flags

The command accepts [common flags][common-flags] and the following additional flags:

#### `--dir`

The path to your built Mastra output directory. Defaults to `.mastra/output`.

#### `--no-telemetry`

Disable the [OTEL Tracing](/docs/observability/otel-tracing).

## `mastra lint`

The `mastra lint` command validates the structure and code of your Mastra project to ensure it follows best practices and is error-free.

It accepts [common flags][common-flags].

## `mastra scorers`

The `mastra scorers` command provides management capabilities for evaluation scorers that measure the quality, accuracy, and performance of AI-generated outputs.

Read the [Scorers overview](/docs/scorers/overview) to learn more.

### `add`

Add a new scorer to your project. You can use an interactive prompt:

```bash copy
mastra scorers add
```

Or provide a scorer name directly:

```bash copy
mastra scorers add answer-relevancy
```

Use the [`list`](#list) command to get the correct ID.

### `list`

List all available scorer templates. Use the ID for the `add` command.

## `mastra init`

The `mastra init` command initializes Mastra in an existing project. Use this command to scaffold the necessary folders and configuration without generating a new project from scratch.

### Flags

The command accepts the following additional flags:

#### `--default`

Creates files inside `src` using OpenAI. It also populates the `src/mastra` folders with example code.

#### `--dir`

The directory where Mastra files should be saved to. Defaults to `src`.

#### `--components`

Comma-separated list of components to add. For each component a new folder will be created. Choose from: `"agents" | "tools" | "workflows" | "scorers"`. Defaults to `['agents', 'tools', 'workflows']`.

#### `--llm`

Default model provider. Choose from: `"openai" | "anthropic" | "groq" | "google" | "cerebras" | "mistral"`.

#### `--llm-api-key`

The API key for your chosen model provider. Will be written to an environment variables file (`.env`).

#### `--example`

If enabled, example code is written to the list of components (e.g. example agent code).

#### `--no-example`

Do not include example code. Useful when using the `--default` flag.

#### `--mcp`

Configure your code editor with Mastra's MCP server. Choose from: `"cursor" | "cursor-global" | "windsurf" | "vscode"`.

## Common flags

### `--dir`

**Available in:** `dev`, `build`, `lint`

The path to your Mastra folder. Defaults to `src/mastra`.

### `--debug`

**Available in:** `dev`, `build`

Enable verbose logging for Mastra's internals. Defaults to `false`.

### `--env`

**Available in:** `dev`, `start`

Custom environment variables file to include. By default, includes `.env.development`, `.env.local`, and `.env`.

### `--root`

**Available in:** `dev`, `build`, `lint`

Path to your root folder. Defaults to `process.cwd()`.

### `--tools`

**Available in:** `dev`, `build`, `lint`

Comma-separated list of tool paths to include. Defaults to `src/mastra/tools`.

## Global flags

Use these flags to get information about the `mastra` CLI.

### `--version`

Prints the Mastra CLI version and exits.

### `--help`

Prints help message and exits.

## Telemetry

By default, Mastra collects anonymous information about your project like your OS, Mastra version or Node.js version. You can read the [source code](https://github.com/mastra-ai/mastra/blob/main/packages/cli/src/analytics/index.ts) to check what's collected.

You can opt out of the CLI analytics by setting an environment variable:

```bash copy
MASTRA_TELEMETRY_DISABLED=1
```

You can also set this while using other `mastra` commands:

```bash copy
MASTRA_TELEMETRY_DISABLED=1 mastra dev
```

[common-flags]: #common-flags

---
title: Mastra Client Agents API
description: Learn how to interact with Mastra AI agents, including generating responses, streaming interactions, and managing agent tools using the client-js SDK.
---

# Agents API
[EN] Source: https://mastra.ai/en/reference/client-js/agents

The Agents API provides methods to interact with Mastra AI agents, including generating responses, streaming interactions, and managing agent tools.

## Getting All Agents

Retrieve a list of all available agents:

```typescript
const agents = await mastraClient.getAgents();
```

## Working with a Specific Agent

Get an instance of a specific agent:

```typescript
const agent = mastraClient.getAgent("agent-id");
```

## Agent Methods

### Get Agent Details

Retrieve detailed information about an agent:

```typescript
const details = await agent.details();
```

### Generate Response

Generate a response from the agent:

```typescript
const response = await agent.generate({
  messages: [
    {
      role: "user",
      content: "Hello, how are you?",
    },
  ],
  threadId: "thread-1", // Optional: Thread ID for conversation context
  resourceId: "resource-1", // Optional: Resource ID
  output: {}, // Optional: Output configuration
});
```

### Stream Response

Stream responses from the agent for real-time interactions:

```typescript
const response = await agent.stream({
  messages: [
    {
      role: "user",
      content: "Tell me a story",
    },
  ],
});

// Process data stream with the processDataStream util
response.processDataStream({
  onChunk: async(chunk) => {
    console.log(chunk);
  },
});


// You can also read from response body directly
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

### Client tools

Client-side tools allow you to execute custom functions on the client side when the agent requests them.

#### Basic Usage

```typescript
import { createTool } from '@mastra/client-js';
import { z } from 'zod';

const colorChangeTool = createTool({
  id: 'changeColor',
  description: 'Changes the background color',
  inputSchema: z.object({
    color: z.string(),
  }),
  execute: async ({ context }) => {
    document.body.style.backgroundColor = context.color;
    return { success: true };
  }
})


// Use with generate
const response = await agent.generate({
  messages: 'Change the background to blue',
  clientTools: {colorChangeTool},
});

// Use with stream
const response = await agent.stream({
  messages: 'Change the background to green',
  clientTools: {colorChangeTool},
});

response.processDataStream({
  onChunk: async (chunk) => {
    if (chunk.type === 'text-delta') {
      console.log(chunk.payload.text);
    } else if (chunk.type === 'tool-call') {
      console.log(`calling tool ${chunk.payload.toolName} with args ${JSON.stringify(chunk.payload.args, null, 2)}`);
    }
  },
});
```

### Get Agent Tool

Retrieve information about a specific tool available to the agent:

```typescript
const tool = await agent.getTool("tool-id");
```

### Get Agent Evaluations

Get evaluation results for the agent:

```typescript
// Get CI evaluations
const evals = await agent.evals();

// Get live evaluations
const liveEvals = await agent.liveEvals();
```


### Stream


Stream responses using the enhanced API with improved method signatures. This method provides enhanced capabilities and format flexibility, with support for Mastra's native format.

```typescript
const response = await agent.stream(
  "Tell me a story",
  {
    threadId: "thread-1",
    clientTools: { colorChangeTool },
  }
);

// Process the stream
response.processDataStream({
  onChunk: async (chunk) => {
    if (chunk.type === 'text-delta') {
      console.log(chunk.payload.text);
    }
  },
});
```

#### AI SDK compatible format

To stream AI SDK-formatted parts on the client from an `agent.stream(...)` response, wrap `response.processDataStream` into a `ReadableStream<ChunkType>` and use `toAISdkFormat`:

```typescript filename="client-ai-sdk-transform.ts" copy
import { createUIMessageStream } from 'ai';
import { toAISdkFormat } from '@mastra/ai-sdk';
import type { ChunkType, MastraModelOutput } from '@mastra/core/stream';

const response = await agent.stream({ messages: 'Tell me a story' });

const chunkStream: ReadableStream<ChunkType> = new ReadableStream<ChunkType>({
  start(controller) {
    response.processDataStream({
      onChunk: async (chunk) => controller.enqueue(chunk as ChunkType),
    }).finally(() => controller.close());
  },
});

const uiMessageStream = createUIMessageStream({
  execute: async ({ writer }) => {
    for await (const part of toAISdkFormat(chunkStream as unknown as MastraModelOutput, { from: 'agent' })) {
      writer.write(part);
    }
  },
});

for await (const part of uiMessageStream) {
  console.log(part);
}
```

### Generate

Generate a response using the enhanced API with improved method signatures and AI SDK v5 compatibility:

```typescript
const response = await agent.generate(
  "Hello, how are you?",
  {
    threadId: "thread-1",
    resourceId: "resource-1",
  }
);
```


---
title: Mastra Client Error Handling
description: Learn about the built-in retry mechanism and error handling capabilities in the Mastra client-js SDK.
---

# Error Handling
[EN] Source: https://mastra.ai/en/reference/client-js/error-handling

The Mastra Client SDK includes built-in retry mechanism and error handling capabilities.

## Error Handling

All API methods can throw errors that you can catch and handle:

```typescript
try {
  const agent = mastraClient.getAgent("agent-id");
  const response = await agent.generate({
    messages: [{ role: "user", content: "Hello" }],
  });
} catch (error) {
  console.error("An error occurred:", error.message);
}
```


---
title: Mastra Client Logs API
description: Learn how to access and query system logs and debugging information in Mastra using the client-js SDK.
---

# Logs API
[EN] Source: https://mastra.ai/en/reference/client-js/logs

The Logs API provides methods to access and query system logs and debugging information in Mastra.

## Getting Logs

Retrieve system logs with optional filtering:

```typescript
const logs = await mastraClient.getLogs({
  transportId: "transport-1",
});
```

## Getting Logs for a Specific Run

Retrieve logs for a specific execution run:

```typescript
const runLogs = await mastraClient.getLogForRun({
  runId: "run-1",
  transportId: "transport-1",
});
```


---
title: MastraClient
description: Learn how to interact with Mastra using the client-js SDK.
---

# Mastra Client SDK
[EN] Source: https://mastra.ai/en/reference/client-js/mastra-client

The Mastra Client SDK provides a simple and type-safe interface for interacting with your [Mastra Server](/docs/deployment/server-deployment.mdx) from your client environment.

## Usage example

```typescript filename="lib/mastra/mastra-client.ts" showLineNumbers copy
import { MastraClient } from "@mastra/client-js";

export const mastraClient = new MastraClient({
  baseUrl: "http://localhost:4111/",
});
```

## Parameters

<PropertiesTable
  content={[
    {
      name: "baseUrl",
      type: "string",
      description: "The base URL for the Mastra API. All requests will be sent relative to this URL.",
      isOptional: false,
    },
    {
      name: "retries",
      type: "number",
      description: "The number of times a request will be retried on failure before throwing an error.",
      isOptional: true,
      defaultValue: "3",
    },
    {
      name: "backoffMs",
      type: "number",
      description: "The initial delay in milliseconds before retrying a failed request. This value is doubled with each retry (exponential backoff).",
      isOptional: true,
      defaultValue: "300",
    },
    {
      name: "maxBackoffMs",
      type: "number",
      description: "The maximum backoff time in milliseconds. Prevents retries from waiting too long between attempts.",
      isOptional: true,
      defaultValue: "5000",
    },
    {
      name: "headers",
      type: "Record<string, string>",
      description: "An object containing custom HTTP headers to include with every request.",
      isOptional: true,
    },
    {
      name: "credentials",
      type: '"omit" | "same-origin" | "include"',
      description: "Credentials mode for requests. See https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials for more info.",
      isOptional: true,
    },
  ]}
/>

## Methods

<PropertiesTable
  content={[
    {
      name: "getAgents()",
      type: "Promise<Record<string, GetAgentResponse>>",
      description: "Returns all available agent instances.",
    },
    {
      name: "getAgent(agentId)",
      type: "Agent",
      description: "Retrieves a specific agent instance by ID.",
    },
    {
      name: "getMemoryThreads(params)",
      type: "Promise<StorageThreadType[]>",
      description: "Retrieves memory threads for the specified resource and agent. Requires a `resourceId` and an `agentId`.",
    },
    {
      name: "createMemoryThread(params)",
      type: "Promise<MemoryThread>",
      description: "Creates a new memory thread with the given parameters.",
    },
    {
      name: "getMemoryThread(threadId)",
      type: "Promise<MemoryThread>",
      description: "Fetches a specific memory thread by ID.",
    },
    {
      name: "saveMessageToMemory(params)",
      type: "Promise<void>",
      description: "Saves one or more messages to the memory system.",
    },
    {
      name: "getMemoryStatus()",
      type: "Promise<MemoryStatus>",
      description: "Returns the current status of the memory system.",
    },
    {
      name: "getTools()",
      type: "Record<string, Tool>",
      description: "Returns all available tools.",
    },
    {
      name: "getTool(toolId)",
      type: "Tool",
      description: "Retrieves a specific tool instance by ID.",
    },
    {
      name: "getWorkflows()",
      type: "Record<string, Workflow>",
      description: "Returns all available workflow instances.",
    },
    {
      name: "getWorkflow(workflowId)",
      type: "Workflow",
      description: "Retrieves a specific workflow instance by ID.",
    },
    {
      name: "getVector(vectorName)",
      type: "MastraVector",
      description: "Returns a vector store instance by name.",
    },
    {
      name: "getLogs(params)",
      type: "Promise<LogEntry[]>",
      description: "Fetches system logs matching the provided filters.",
    },
    {
      name: "getLog(params)",
      type: "Promise<LogEntry>",
      description: "Retrieves a specific log entry by ID or filter.",
    },
    {
      name: "getLogTransports()",
      type: "string[]",
      description: "Returns the list of configured log transport types.",
    },
    {
      name: "getAITrace(traceId)",
      type: "Promise<AITraceRecord>",
      description: "Retrieves a specific AI trace by ID, including all its spans and details.",
    },
    {
      name: "getAITraces(params)",
      type: "Promise<GetAITracesResponse>",
      description: "Retrieves paginated list of AI trace root spans with optional filtering. Use getAITrace() to get complete traces with all spans.",
    },
  ]}
/>



---
title: Mastra Client Memory API
description: Learn how to manage conversation threads and message history in Mastra using the client-js SDK.
---

# Memory API
[EN] Source: https://mastra.ai/en/reference/client-js/memory

The Memory API provides methods to manage conversation threads and message history in Mastra.

### Get All Threads

Retrieve all memory threads for a specific resource:

```typescript
const threads = await mastraClient.getMemoryThreads({
  resourceId: "resource-1",
  agentId: "agent-1",
});
```

### Create a New Thread

Create a new memory thread:

```typescript
const thread = await mastraClient.createMemoryThread({
  title: "New Conversation",
  metadata: { category: "support" },
  resourceId: "resource-1",
  agentId: "agent-1",
});
```

### Working with a Specific Thread

Get an instance of a specific memory thread:

```typescript
const thread = mastraClient.getMemoryThread("thread-id", "agent-id");
```

## Thread Methods

### Get Thread Details

Retrieve details about a specific thread:

```typescript
const details = await thread.get();
```

### Update Thread

Update thread properties:

```typescript
const updated = await thread.update({
  title: "Updated Title",
  metadata: { status: "resolved" },
  resourceId: "resource-1",
});
```

### Delete Thread

Delete a thread and its messages:

```typescript
await thread.delete();
```

## Message Operations

### Save Messages

Save messages to memory:

```typescript
const savedMessages = await mastraClient.saveMessageToMemory({
  messages: [
    {
      role: "user",
      content: "Hello!",
      id: "1",
      threadId: "thread-1",
      createdAt: new Date(),
      type: "text",
    },
  ],
  agentId: "agent-1",
});
```

### Retrieve Thread Messages

Get messages associated with a memory thread:

```typescript
// Get all messages in the thread
const { messages } = await thread.getMessages();

// Limit the number of messages retrieved
const { messages } = await thread.getMessages({ limit: 10 });
```

### Delete a Message

Delete a specific message from a thread:

```typescript
const result = await thread.deleteMessage("message-id");
// Returns: { success: true, message: "Message deleted successfully" }
```

### Delete Multiple Messages

Delete multiple messages from a thread in a single operation:

```typescript
const result = await thread.deleteMessages(["message-1", "message-2", "message-3"]);
// Returns: { success: true, message: "3 messages deleted successfully" }
```

### Get Memory Status

Check the status of the memory system:

```typescript
const status = await mastraClient.getMemoryStatus("agent-id");
```


---
title: Mastra Client Observability API
description: Learn how to retrieve AI traces, monitor application performance, and score traces using the client-js SDK.
---

# Observability API
[EN] Source: https://mastra.ai/en/reference/client-js/observability

The Observability API provides methods to retrieve AI traces, monitor your application's performance, and score traces for evaluation. This helps you understand how your AI agents and workflows are performing.

## Getting a Specific AI Trace

Retrieve a specific AI trace by its ID, including all its spans and details:

```typescript
const trace = await mastraClient.getAITrace("trace-id-123");
```

## Getting AI Traces with Filtering

Retrieve a paginated list of AI trace root spans with optional filtering:

```typescript
const traces = await mastraClient.getAITraces({
  pagination: {
    page: 1,
    perPage: 20,
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    }
  },
  filters: {
    name: "weather-agent", // Filter by trace name
    spanType: "agent", // Filter by span type
    entityId: "weather-agent-id", // Filter by entity ID
    entityType: "agent" // Filter by entity type
  }
});

console.log(`Found ${traces.spans.length} root spans`);
console.log(`Total pages: ${traces.pagination.totalPages}`);

// To get the complete trace with all spans, use getAITrace
const completeTrace = await mastraClient.getAITrace(traces.spans[0].traceId);
```

## Scoring Traces

Score specific traces using registered scorers for evaluation:

```typescript
const result = await mastraClient.score({
  scorerName: "answer-relevancy",
  targets: [
    { traceId: "trace-1", spanId: "span-1" }, // Score specific span
    { traceId: "trace-2" }, // Score specific span which defaults to the parent span
  ]
});
```

## Getting Scores by Span

Retrieve scores for a specific span within a trace:

```typescript
const scores = await mastraClient.getScoresBySpan({
  traceId: "trace-123",
  spanId: "span-456",
  page: 1,
  perPage: 20
});
```
## Related

- [Agents API](./agents) - Learn about agent interactions that generate traces
- [Workflows API](./workflows) - Understand workflow execution monitoring  


---
title: Mastra Client Telemetry API
description: Learn how to retrieve and analyze traces from your Mastra application for monitoring and debugging using the client-js SDK.
---

# Telemetry API
[EN] Source: https://mastra.ai/en/reference/client-js/telemetry

The Telemetry API provides methods to retrieve and analyze traces from your Mastra application. This helps you monitor and debug your application's behavior and performance.

## Getting Traces

Retrieve traces with optional filtering and pagination:

```typescript
const telemetry = await mastraClient.getTelemetry({
  name: "trace-name", // Optional: Filter by trace name
  scope: "scope-name", // Optional: Filter by scope
  page: 1, // Optional: Page number for pagination
  perPage: 10, // Optional: Number of items per page
  attribute: {
    // Optional: Filter by custom attributes
    key: "value",
  },
});
```


---
title: Mastra Client Tools API
description: Learn how to interact with and execute tools available in the Mastra platform using the client-js SDK.
---

# Tools API
[EN] Source: https://mastra.ai/en/reference/client-js/tools

The Tools API provides methods to interact with and execute tools available in the Mastra platform.

## Getting All Tools

Retrieve a list of all available tools:

```typescript
const tools = await mastraClient.getTools();
```

## Working with a Specific Tool

Get an instance of a specific tool:

```typescript
const tool = mastraClient.getTool("tool-id");
```

## Tool Methods

### Get Tool Details

Retrieve detailed information about a tool:

```typescript
const details = await tool.details();
```

### Execute Tool

Execute a tool with specific arguments:

```typescript
const result = await tool.execute({
  args: {
    param1: "value1",
    param2: "value2",
  },
  threadId: "thread-1", // Optional: Thread context
  resourceId: "resource-1", // Optional: Resource identifier
});
```


---
title: Mastra Client Vectors API
description: Learn how to work with vector embeddings for semantic search and similarity matching in Mastra using the client-js SDK.
---

# Vectors API
[EN] Source: https://mastra.ai/en/reference/client-js/vectors

The Vectors API provides methods to work with vector embeddings for semantic search and similarity matching in Mastra.

## Working with Vectors

Get an instance of a vector store:

```typescript
const vector = mastraClient.getVector("vector-name");
```

## Vector Methods

### Get Vector Index Details

Retrieve information about a specific vector index:

```typescript
const details = await vector.details("index-name");
```

### Create Vector Index

Create a new vector index:

```typescript
const result = await vector.createIndex({
  indexName: "new-index",
  dimension: 128,
  metric: "cosine", // 'cosine', 'euclidean', or 'dotproduct'
});
```

### Upsert Vectors

Add or update vectors in an index:

```typescript
const ids = await vector.upsert({
  indexName: "my-index",
  vectors: [
    [0.1, 0.2, 0.3], // First vector
    [0.4, 0.5, 0.6], // Second vector
  ],
  metadata: [{ label: "first" }, { label: "second" }],
  ids: ["id1", "id2"], // Optional: Custom IDs
});
```

### Query Vectors

Search for similar vectors:

```typescript
const results = await vector.query({
  indexName: "my-index",
  queryVector: [0.1, 0.2, 0.3],
  topK: 10,
  filter: { label: "first" }, // Optional: Metadata filter
  includeVector: true, // Optional: Include vectors in results
});
```

### Get All Indexes

List all available indexes:

```typescript
const indexes = await vector.getIndexes();
```

### Delete Index

Delete a vector index:

```typescript
const result = await vector.delete("index-name");
```


---
title: Mastra Client Workflows (Legacy) API
description: Learn how to interact with and execute automated legacy workflows in Mastra using the client-js SDK.
---

# Workflows (Legacy) API
[EN] Source: https://mastra.ai/en/reference/client-js/workflows-legacy

The Workflows (Legacy) API provides methods to interact with and execute automated legacy workflows in Mastra.

## Getting All Legacy Workflows

Retrieve a list of all available legacy workflows:

```typescript
const workflows = await mastraClient.getLegacyWorkflows();
```

## Working with a Specific Legacy Workflow

Get an instance of a specific legacy workflow:

```typescript
const workflow = mastraClient.getLegacyWorkflow("workflow-id");
```

## Legacy Workflow Methods

### Get Legacy Workflow Details

Retrieve detailed information about a legacy workflow:

```typescript
const details = await workflow.details();
```

### Start Legacy Workflow run asynchronously

Start a legacy workflow run with triggerData and await full run results:

```typescript
const { runId } = workflow.createRun();

const result = await workflow.startAsync({
  runId,
  triggerData: {
    param1: "value1",
    param2: "value2",
  },
});
```

### Resume Legacy Workflow run asynchronously

Resume a suspended legacy workflow step and await full run result:

```typescript
const { runId } = createRun({ runId: prevRunId });

const result = await workflow.resumeAsync({
  runId,
  stepId: "step-id",
  contextData: { key: "value" },
});
```

### Watch Legacy Workflow

Watch legacy workflow transitions

```typescript
try {
  // Get workflow instance
  const workflow = mastraClient.getLegacyWorkflow("workflow-id");

  // Create a workflow run
  const { runId } = workflow.createRun();

  // Watch workflow run
  workflow.watch({ runId }, (record) => {
    // Every new record is the latest transition state of the workflow run

    console.log({
      activePaths: record.activePaths,
      results: record.results,
      timestamp: record.timestamp,
      runId: record.runId,
    });
  });

  // Start workflow run
  workflow.start({
    runId,
    triggerData: {
      city: "New York",
    },
  });
} catch (e) {
  console.error(e);
}
```

### Resume Legacy Workflow

Resume legacy workflow run and watch legacy workflow step transitions

```typescript
try {
  //To resume a workflow run, when a step is suspended
  const { run } = createRun({ runId: prevRunId });

  //Watch run
  workflow.watch({ runId }, (record) => {
    // Every new record is the latest transition state of the workflow run

    console.log({
      activePaths: record.activePaths,
      results: record.results,
      timestamp: record.timestamp,
      runId: record.runId,
    });
  });

  //resume run
  workflow.resume({
    runId,
    stepId: "step-id",
    contextData: { key: "value" },
  });
} catch (e) {
  console.error(e);
}
```

### Legacy Workflow run result

A legacy workflow run result yields the following:

| Field         | Type                                                                           | Description                                                        |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `activePaths` | `Record<string, { status: string; suspendPayload?: any; stepPath: string[] }>` | Currently active paths in the workflow with their execution status |
| `results`     | `LegacyWorkflowRunResult<any, any, any>['results']`                            | Results from the workflow execution                                |
| `timestamp`   | `number`                                                                       | Unix timestamp of when this transition occurred                    |
| `runId`       | `string`                                                                       | Unique identifier for this workflow run instance                   |


---
title: Mastra Client Workflows API
description: Learn how to interact with and execute automated workflows in Mastra using the client-js SDK.
---

# Workflows API
[EN] Source: https://mastra.ai/en/reference/client-js/workflows

The Workflows API provides methods to interact with and execute automated workflows in Mastra.

## Getting All Workflows

Retrieve a list of all available workflows:

```typescript
const workflows = await mastraClient.getWorkflows();
```

## Working with a Specific Workflow

Get an instance of a specific workflow as defined by the const name:

```typescript filename="src/mastra/workflows/test-workflow.ts"
export const testWorkflow = createWorkflow({
  id: 'city-workflow'
})
```

```typescript
const workflow = mastraClient.getWorkflow("testWorkflow");
```

## Workflow Methods

### Get Workflow Details

Retrieve detailed information about a workflow:

```typescript
const details = await workflow.details();
```

### Start workflow run asynchronously

Start a workflow run with inputData and await full run results:

```typescript
const run = await workflow.createRunAsync();

const result = await run.startAsync({
  inputData: {
    city: "New York",
  },
});
```

### Resume Workflow run asynchronously

Resume a suspended workflow step and await full run result:

```typescript
const run = await workflow.createRunAsync();

const result = await run.resumeAsync({
  step: "step-id",
  resumeData: { key: "value" },
});
```

### Watch Workflow

Watch workflow transitions:

```typescript
try {
  const workflow = mastraClient.getWorkflow("testWorkflow");

  const run = await workflow.createRunAsync();

  run.watch((record) => {
    console.log(record);
  });

  const result = await run.start({
    inputData: {
      city: "New York",
    },
  });
} catch (e) {
  console.error(e);
}
```

### Resume Workflow

Resume workflow run and watch workflow step transitions:

```typescript
try {
  const workflow = mastraClient.getWorkflow("testWorkflow");

  const run = await workflow.createRunAsync({ runId: prevRunId });

  run.watch((record) => {
    console.log(record);
  });

  run.resume({
    step: "step-id",
    resumeData: { key: "value" },
  });
} catch (e) {
  console.error(e);
}
```

### Stream Workflow

Stream workflow execution for real-time updates:

```typescript
try {
  const workflow = mastraClient.getWorkflow("testWorkflow");

  const run = await workflow.createRunAsync();

  const stream = await run.stream({
    inputData: {
      city: 'New York',
    },
  });

  for await (const chunk of stream) {
    console.log(JSON.stringify(chunk, null, 2));
  }
} catch (e) {
  console.error('Workflow error:', e);
}
```

### Get Workflow Run result

Get the result of a workflow run:

```typescript
try  {
  const workflow = mastraClient.getWorkflow("testWorkflow");

  const run = await workflow.createRunAsync();

  // start the workflow run
  const startResult = await run.start({
    inputData: {
      city: "New York",
    },
  });

  const result = await workflow.runExecutionResult(run.runId);

  console.log(result);
} catch (e) {
  console.error(e);
}
```

This is useful when dealing with long running workflows. You can use this to poll the result of the workflow run.

### Workflow run result

A workflow run result yields the following:

| Field            | Type                                                                                                                                                                                                                                               | Description                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `payload`        | `{currentStep?: {id: string, status: string, output?: Record<string, any>, payload?: Record<string, any>}, workflowState: {status: string, steps: Record<string, {status: string, output?: Record<string, any>, payload?: Record<string, any>}>}}` | The current step and workflow state of the run   |
| `eventTimestamp` | `Date`                                                                                                                                                                                                                                             | The timestamp of the event                       |
| `runId`          | `string`                                                                                                                                                                                                                                           | Unique identifier for this workflow run instance |



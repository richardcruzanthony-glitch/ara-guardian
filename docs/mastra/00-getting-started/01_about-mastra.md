---
title: "About Mastra | Mastra Docs"
description: "Mastra is an all-in-one framework for building AI-powered applications and agents with a modern TypeScript stack."
---

import YouTube from "@/components/youtube";

# About Mastra
[EN] Source: https://mastra.ai/en/docs

From the team behind Gatsby, Mastra is a framework for building AI-powered applications and agents with a modern TypeScript stack.

It includes everything you need to go from early prototypes to production-ready applications. Mastra integrates with frontend and backend frameworks like React, Next.js, and Node, or you can deploy it anywhere as a standalone server. It's the easiest way to build, tune, and scale reliable AI products.

<YouTube id="8o_Ejbcw5s8" />

## Why Mastra?

Purpose-built for TypeScript and designed around established AI patterns, Mastra gives you everything you need to build great AI applications out-of-the-box.

Some highlights include:

- [**Model routing**](/models) - Connect to 40+ providers through one standard interface. Use models from OpenAI, Anthropic, Gemini, and more.

- [**Agents**](/docs/agents/overview) - Build autonomous agents that use LLMs and tools to solve open-ended tasks. Agents reason about goals, decide which tools to use,  and iterate internally until the model emits a final answer or an optional stopping condition is met.

- [**Workflows**](/docs/workflows/overview) - When you need explicit control over execution, use Mastra's graph-based workflow engine to orchestrate complex multi-step processes. Mastra workflows use an intuitive syntax for control flow (`.then()`, `.branch()`, `.parallel()`).

- [**Human-in-the-loop**](/docs/workflows/suspend-and-resume) - Suspend an agent or workflow and await user input or approval before resuming. Mastra uses [storage](/docs/server-db/storage) to remember execution state, so you can pause indefinitely and resume where you left off.

- **Context management** - Give your agents the right context at the right time. Provide [conversation history](/docs/memory/conversation-history), [retrieve](/docs/rag/overview) data from your sources (APIs, databases, files), and add human-like [working](/docs/memory/working-memory) and [semantic](/docs/memory/semantic-recall) memory so your agents behave coherently. 

- **Integrations** - Bundle agents and workflows into existing React, Next.js, or Node.js apps, or ship them as standalone endpoints. When building UIs, integrate with agentic libraries like Vercel's AI SDK UI and CopilotKit to bring your AI assistant to life on the web.

- **Production essentials** - Shipping reliable agents takes ongoing insight, evaluation, and iteration. With built-in [evals](/docs/evals/overview) and [observability](/docs/observability/overview), Mastra gives you the tools to observe, measure, and refine continuously.


## What can you build?

- AI-powered applications that combine language understanding, reasoning, and action to solve real-world tasks.

- Conversational agents for customer support, onboarding, or internal queries.

- Domain-specific copilots for coding, legal, finance, research, or creative work.

- Workflow automations that trigger, route, and complete multi-step processes.

- Decision-support tools that analyse data and provide actionable recommendations.

Explore real-world examples in our [case studies](/blog/category/case-studies) and [community showcase](/showcase).


## Get started

Follow the [Installation guide](/docs/getting-started/installation) for step-by-step setup with the CLI or a manual install.

If you're new to AI agents, check out our [templates](/docs/getting-started/templates), [course](/course), and [YouTube videos](https://youtube.com/@mastra-ai) to start building with Mastra today.

We can't wait to see what you build ✌️ 

---
title: Understanding the Mastra Cloud Dashboard
description: Details of each feature available in Mastra Cloud
---

import { MastraCloudCallout } from '@/components/mastra-cloud-callout'

# Navigating the Dashboard
[EN] Source: https://mastra.ai/en/docs/mastra-cloud/dashboard

This page explains how to navigate the Mastra Cloud dashboard, where you can configure your project, view deployment details, and interact with agents and workflows using the built-in [Playground](/docs/mastra-cloud/dashboard#playground).

<MastraCloudCallout />

## Overview

The **Overview** page provides details about your application, including its domain URL, status, latest deployment, and connected agents and workflows.

![Project dashboard](/image/mastra-cloud/mastra-cloud-project-dashboard.jpg)

Key features:

Each project shows its current deployment status, active domains, and environment variables, so you can quickly understand how your application is running.

## Deployments

The **Deployments** page shows recent builds and gives you quick access to detailed build logs. Click any row to view more information about a specific deployment.

![Dashboard deployment](/image/mastra-cloud/mastra-cloud-dashboard-deployments.jpg)

Key features:

Each deployment includes its current status, the Git branch it was deployed from, and a title generated from the commit hash.

## Logs

The **Logs** page is where you'll find detailed information to help debug and monitor your application's behavior in the production environment.

![Dashboard logs](/image/mastra-cloud/mastra-cloud-dashboard-logs.jpg)

Key features:

Each log includes a severity level and detailed messages showing agent, workflow, and storage activity.

## Settings

On the **Settings** page you can modify the configuration of your application.

![Dashboard settings](/image/mastra-cloud/mastra-cloud-dashboard-settings.jpg)

Key features:

You can manage environment variables, edit key project settings like the name and branch, configure storage with LibSQLStore, and set a stable URL for your endpoints.

> Changes to configuration require a new deployment before taking effect.

## Playground

### Agents

On the **Agents** page you'll see all agents used in your application. Click any agent to interact using the chat interface.

![Dashboard playground agents](/image/mastra-cloud/mastra-cloud-dashboard-playground-agents.jpg)

Key features:

Test your agents in real time using the chat interface, review traces of each interaction, and see evaluation scores for every response.

### Workflows

On the **Workflows** page you'll see all workflows used in your application. Click any workflow to interact using the runner interface.

![Dashboard playground workflows](/image/mastra-cloud/mastra-cloud-dashboard-playground-workflows.jpg)

Key features:

Visualize your workflow with a step-by-step graph, view execution traces, and run workflows directly using the built-in runner.

### Tools

On the **Tools** page you'll see all tools used by your agents. Click any tool to interact using the input interface.

![Dashboard playground tools](/image/mastra-cloud/mastra-cloud-dashboard-playground-tools.jpg)

Key features:

Test your tools by providing an input that matches the schema and viewing the structured output.

## MCP Servers

The **MCP Servers** page lists all MCP Servers included in your application. Click any MCP Server for more information.

![Dashboard playground mcp servers](/image/mastra-cloud/mastra-cloud-dashboard-playground-mcpservers.jpg)

Key features:

Each MCP Server includes API endpoints for HTTP and SSE, along with IDE configuration snippets for tools like Cursor and Windsurf.

## Next steps

- [Understanding Tracing and Logs](/docs/mastra-cloud/observability)


---
title: Observability in Mastra Cloud
description: Monitoring and debugging tools for Mastra Cloud deployments
---

import { MastraCloudCallout } from '@/components/mastra-cloud-callout'

# Understanding Tracing and Logs
[EN] Source: https://mastra.ai/en/docs/mastra-cloud/observability

Mastra Cloud captures execution data to help you monitor your application's behavior in the production environment.

<MastraCloudCallout />

## Logs

You can view detailed logs for debugging and monitoring your application's behavior on the [Logs](/docs/mastra-cloud/dashboard#logs) page of the Dashboard.

![Dashboard logs](/image/mastra-cloud/mastra-cloud-dashboard-logs.jpg)

Key features:

Each log entry includes its severity level and a detailed message showing agent, workflow, or storage activity.

## Traces

More detailed traces are available for both agents and workflows by using a [logger](/docs/observability/logging) or enabling [telemetry](/docs/observability/tracing) using one of our [supported providers](/reference/observability/providers).

### Agents

With a [logger](/docs/observability/logging) enabled, you can view detailed outputs from your agents in the **Traces** section of the Agents Playground.

![observability agents](/image/mastra-cloud/mastra-cloud-observability-agents.jpg)

Key features:

Tools passed to the agent during generation are standardized using `convertTools`. This includes retrieving client-side tools, memory tools, and tools exposed from workflows.


### Workflows

With a [logger](/docs/observability/logging) enabled, you can view detailed outputs from your workflows in the **Traces** section of the Workflows Playground.

![observability workflows](/image/mastra-cloud/mastra-cloud-observability-workflows.jpg)

Key features:

Workflows are created using `createWorkflow`, which sets up steps, metadata, and tools. You can run them with `runWorkflow` by passing input and options.

## Next steps

- [Logging](/docs/observability/logging)
- [Tracing](/docs/observability/tracing)


---
title: Mastra Cloud
description: Deployment and monitoring service for Mastra applications
---

import { MastraCloudCallout } from '@/components/mastra-cloud-callout'
import { FileTree } from "nextra/components";

# Mastra Cloud
[EN] Source: https://mastra.ai/en/docs/mastra-cloud/overview

[Mastra Cloud](https://mastra.ai/cloud) is a platform for deploying, managing, monitoring, and debugging Mastra applications. When you [deploy](/docs/mastra-cloud/setting-up) your application, Mastra Cloud exposes your agents, tools, and workflows as REST API endpoints.

<MastraCloudCallout />

## Platform features

Deploy and manage your applications with automated builds, organized projects, and no additional configuration.

![Platform features](/image/mastra-cloud/mastra-cloud-platform-features.jpg)

Key features:

Mastra Cloud supports zero-config deployment, continuous integration with GitHub, and atomic deployments that package agents, tools, and workflows together.

## Project Dashboard

Monitor and debug your applications with detailed output logs, deployment state, and interactive tools.

![Project dashboard](/image/mastra-cloud/mastra-cloud-project-dashboard.jpg)

Key features:

The Project Dashboard gives you an overview of your application's status and deployments, with access to logs and a built-in playground for testing agents and workflows.

## Project structure

Use a standard Mastra project structure for proper detection and deployment.

<FileTree>
  <FileTree.Folder name="src" defaultOpen>
    <FileTree.Folder name="mastra" defaultOpen>
      <FileTree.Folder name="agents" defaultOpen>
        <FileTree.File name="agent-name.ts" />
      </FileTree.Folder>
      <FileTree.Folder name="tools" defaultOpen>
        <FileTree.File name="tool-name.ts" />
      </FileTree.Folder>
      <FileTree.Folder name="workflows" defaultOpen>
        <FileTree.File name="workflow-name.ts" />
      </FileTree.Folder>
      <FileTree.File name="index.ts" />
    </FileTree.Folder>
  </FileTree.Folder>
  <FileTree.File name="package.json" />
</FileTree>

Mastra Cloud scans your repository for:

- **Agents**: Defined using: `new Agent({...})`
- **Tools**: Defined using: `createTool({...})`
- **Workflows**: Defined using: `createWorkflow({...})`
- **Steps**: Defined using: `createStep({...})`
- **Environment Variables**: API keys and configuration variables

## Technical implementation

Mastra Cloud is purpose-built for Mastra agents, tools, and workflows. It handles long-running requests, records detailed traces for every execution, and includes built-in support for evals.

## Next steps

- [Setting Up and Deploying](/docs/mastra-cloud/setting-up)


---
title: Setting Up a Project
description: Configuration steps for Mastra Cloud projects
---

import { MastraCloudCallout } from '@/components/mastra-cloud-callout'
import { Steps } from "nextra/components";

# Setting Up and Deploying
[EN] Source: https://mastra.ai/en/docs/mastra-cloud/setting-up

This page explains how to set up a project on [Mastra Cloud](https://mastra.ai/cloud) with automatic deployments using our GitHub integration.

<MastraCloudCallout />

## Prerequisites

- A [Mastra Cloud](https://mastra.ai/cloud) account
- A GitHub account / repository containing a Mastra application

> See our [Getting started](/docs/getting-started/installation) guide to scaffold out a new Mastra project with sensible defaults.

## Setup and Deploy process

<Steps>

### Sign in to Mastra Cloud

Head over to [https://cloud.mastra.ai/](https://cloud.mastra.ai) and sign in with either:

- **GitHub**
- **Google**

### Install the Mastra GitHub app

When prompted, install the Mastra GitHub app.

![Install GitHub](/image/mastra-cloud/mastra-cloud-install-github.jpg)

### Create a new project

Click the **Create new project** button to create a new project.

![Create new project](/image/mastra-cloud/mastra-cloud-create-new-project.jpg)

### Import a Git repository

Search for a repository, then click **Import**.

![Import Git repository](/image/mastra-cloud/mastra-cloud-import-git-repository.jpg)

### Configure the deployment

Mastra Cloud automatically detects the right build settings, but you can customize them using the options described below.

![Deployment details](/image/mastra-cloud/mastra-cloud-deployment-details.jpg)

- **Importing from GitHub**: The GitHub repository name
- **Project name**: Customize the project name
- **Branch**: The branch to deploy from
- **Project root**: The root directory of your project
- **Mastra directory**: Where Mastra files are located
- **Environment variables**: Add environment variables used by the application
- **Build and Store settings**:
   - **Install command**: Runs pre-build to install project dependencies
   - **Project setup command**: Runs pre-build to prepare any external dependencies
   - **Port**: The network port the server will use
   - **Store settings**: Use Mastra Cloud's built-in [LibSQLStore](/docs/storage/overview) storage
- **Deploy Project**: Starts the deployment process

### Deploy project

Click **Deploy Project** to create and deploy your application using the configuration you’ve set.

</Steps>

## Successful deployment

After a successful deployment you'll be shown the **Overview** screen where you can view your project's status, domains, latest deployments and connected agents and workflows.

![Successful deployment](/image/mastra-cloud/mastra-cloud-successful-deployment.jpg)

## Continuous integration

Your project is now configured with automatic deployments which occur whenever you push to the configured branch of your GitHub repository.

## Testing your application

After a successful deployment you can test your agents and workflows from the [Playground](/docs/mastra-cloud/dashboard#playground) in Mastra Cloud, or interact with them using our [Client SDK](/docs/client-js/overview).

## Next steps

- [Navigating the Dashboard](/docs/mastra-cloud/dashboard)



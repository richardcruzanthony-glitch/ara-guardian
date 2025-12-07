# ARA Guardian

AI Agent platform built on Mastra framework, deployed to Render.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Create .env file with required variables (see below)
cp .env.example .env

# Build and start
npm run build
npm start
```

The server will listen on `http://0.0.0.0:5000` (or the PORT environment variable).

## Environment Variables

### Required for Production (Render)

```bash
# Server Configuration
PORT=5000
AI_API_KEY=your_secure_api_key_here

# Option 1: Replit AI Integrations (if using Replit)
AI_INTEGRATIONS_OPENAI_BASE_URL=your_replit_base_url
AI_INTEGRATIONS_OPENAI_API_KEY=your_replit_api_key

# Option 2: Standard OpenAI (recommended for Render)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional
MASTRA_TELEMETRY_ENABLED=false
```

### Setting Environment Variables on Render

1. Go to your Render dashboard
2. Select your web service
3. Navigate to "Environment" tab
4. Add the required variables:
   - `PORT` (usually set by Render automatically)
   - `AI_API_KEY` (secure token for chat authentication)
   - `OPENAI_API_KEY` (your OpenAI API key)
   - `MASTRA_TELEMETRY_ENABLED=false`

## Features

- **Chat Interface**: Web-based chat at `/` route
- **AI Agent**: Powered by OpenAI GPT-4o-mini
- **Brain Engine**: Long-term memory system
- **Tools**: Multiple AI tools including pricing, scraping, and reasoning

## API Endpoints

- `GET /` - Chat web interface
- `POST /chat` - Chat API endpoint (requires Authorization header)

### Chat API Example

```bash
curl -X POST https://ara-guardian.onrender.com/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AI_API_KEY" \
  -d '{"message": "Hello, how can you help me?"}'
```

## Development Commands

```bash
npm run dev       # Start development server with hot reload
npm run build     # Build TypeScript to dist/
npm start         # Start production server
npm run check     # Type checking only
npm run format    # Format code with Prettier
```

## Architecture

- **Framework**: Mastra v0.20+
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Agent**: AI SDK v4 compatible
- **Memory**: Long-term knowledge base with encryption support

## Troubleshooting

### Chat Returns "No Reply"

Ensure these environment variables are set correctly on Render:
1. `OPENAI_API_KEY` - Valid OpenAI API key
2. `AI_API_KEY` - Authentication token for chat endpoint

### Build Failures

Make sure `@types/node` is installed:
```bash
npm install --save-dev @types/node
```

### Agent Errors

The agent uses AI SDK v4 models and calls `generateLegacy()`. Ensure the OpenAI API key has sufficient credits and permissions.

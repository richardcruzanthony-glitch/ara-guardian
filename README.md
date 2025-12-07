# Ara Guardian

A self-evolving AI agent platform built on the **Mastra** framework, designed for deployment on Render. The system combines LLM-powered agents with persistent memory, real-time triggers (Telegram, Slack, Cron, Webhooks), and a philosophy of continuous learning from user corrections.

## Quick Start

### Local Development

```bash
npm install
npm run build
npm start
```

The server listens on `PORT` (default `5000`).

### Deploy to Render

For production deployment on Render, see the full guide: **[Render Deployment Guide](docs/RENDER_DEPLOYMENT.md)**

**Quick Render Setup:**
1. Create a new Web Service in [Render Dashboard](https://dashboard.render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add environment variables (`OPENAI_API_KEY`, `BOT_TOKEN`, etc.)
5. Deploy!

## Documentation

- [Render Deployment Guide](docs/RENDER_DEPLOYMENT.md) - Complete instructions for deploying to Render
- [Mastra Documentation](docs/mastra/) - Agent and workflow development
- [Trigger Configuration](docs/triggers/) - Webhook and cron setup

## Architecture

- **Framework:** Mastra v0.20.0
- **Runtime:** Node.js ≥20.9.0
- **AI Providers:** OpenAI, OpenRouter, Anthropic
- **Integrations:** Telegram, Slack, Webhooks, Cron

## Environment Variables

```bash
PORT=5000                          # Server port
MASTRA_TELEMETRY_ENABLED=false     # Telemetry disabled (Iron Mode)
OPENAI_API_KEY=your_key            # OpenAI API key
BOT_TOKEN=your_telegram_token      # Telegram bot token (optional)
DATABASE_URL=postgresql://...      # PostgreSQL connection (optional)
```

## License

ISC

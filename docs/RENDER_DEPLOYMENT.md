# Deploying Ara Guardian to Render

This guide explains how to deploy the Ara Guardian AI agent platform to [Render](https://render.com).

## Prerequisites

1. A [Render account](https://dashboard.render.com/register)
2. A GitHub repository with your Ara Guardian code
3. Required API keys (OpenAI, Telegram bot token, etc.)

## Quick Start

### Step 1: Create a New Web Service

1. Log in to your [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository:
   - If not already connected, click **"Connect GitHub"**
   - Select the `ara-guardian` repository

### Step 2: Configure the Service

Use these settings:

| Setting | Value |
|---------|-------|
| **Name** | `ara-guardian` (or your preferred name) |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your deployment branch) |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Start with **Free** (upgrade as needed) |

### Step 3: Set Environment Variables

In the **"Environment"** section, add:

**Required:**
```
PORT=10000
MASTRA_TELEMETRY_ENABLED=false
OPENAI_API_KEY=your_openai_api_key
```

**Optional (depending on features used):**
```
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://user:password@host:5432/database
SLACK_BOT_TOKEN=your_slack_bot_token
```

> **Note:** Render automatically sets `PORT` at runtime, but you should still add it with value `10000` for compatibility.

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Run `npm install && npm run build`
   - Start your application with `npm start`
3. Wait for the deployment to complete (typically 2-5 minutes)

### Step 5: Verify Deployment

Once deployed, your service will be available at:
```
https://ara-guardian.onrender.com
```
(Replace `ara-guardian` with your actual service name)

Test the deployment:
```bash
curl https://ara-guardian.onrender.com/
```

## Build Process Details

The build process uses `build-simple.js` which:

1. Compiles TypeScript via `tsc`
2. Outputs compiled JavaScript to `dist/`
3. Creates `dist/index.js` entry point that starts the Mastra server

The start command runs `node dist/index.js` which:
- Starts the Mastra server on `0.0.0.0:PORT`
- Registers all tools and agents
- Sets up webhook endpoints

## Alternative: Using render.yaml (Blueprint)

For automated deployments, create a `render.yaml` in your repository root:

```yaml
services:
  - type: web
    name: ara-guardian
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: PORT
        value: 10000
      - key: MASTRA_TELEMETRY_ENABLED
        value: false
      - key: OPENAI_API_KEY
        sync: false  # Set manually in dashboard
      - key: BOT_TOKEN
        sync: false  # Set manually in dashboard
      - key: DATABASE_URL
        sync: false  # Set manually in dashboard
```

Then in Render Dashboard:
1. Go to **Blueprints** → **New Blueprint Instance**
2. Select your repository
3. Render will auto-detect `render.yaml` and configure the service

## Setting Up Webhooks

### Telegram Bot Webhook

After deployment, configure your Telegram bot to use your Render URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ara-guardian.onrender.com/webhooks/telegram/action"}'
```

### Slack Webhook

1. In your Slack App settings, set the **Request URL** to:
   ```
   https://ara-guardian.onrender.com/webhooks/slack/action
   ```

## Database Configuration (Optional)

For persistent memory storage, add a PostgreSQL database:

### Using Render PostgreSQL

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Create the database
3. Copy the **Internal Database URL**
4. Add it as `DATABASE_URL` environment variable to your web service

### Memory File Location

The brain engine looks for `us-complete.txt` in these locations:
- `/opt/render/project/src/us-complete.txt` (production)
- `public/us-complete.txt`
- `.mastra/output/us-complete.txt`

Ensure your knowledge base file is in one of these locations.

## Monitoring & Logs

### View Logs

1. Go to your service in Render Dashboard
2. Click **"Logs"** tab
3. View real-time application logs

### Health Checks

Add a health check endpoint to monitor your service:

By default, Mastra exposes health endpoints. Configure in Render:
- **Health Check Path:** `/`
- **Health Check Timeout:** `30` seconds

## Troubleshooting

### Build Fails

**Error: TypeScript compilation errors**
- Run `npm run build` locally first to identify issues
- Check import paths have `.js` extensions (NodeNext requirement)

**Error: Missing dependencies**
- Ensure all dependencies are in `package.json`
- Check that `node_modules` is not in `.gitignore` (it should be)

### Application Crashes

**Error: Port already in use**
- Remove hardcoded port; use `process.env.PORT`

**Error: Memory issues**
- Upgrade to a larger instance type
- Check for memory leaks in long-running processes

### Webhook Issues

**Telegram webhook not receiving messages**
1. Verify webhook is set: 
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
2. Check Render logs for incoming requests
3. Ensure `BOT_TOKEN` environment variable is set

**Slack events not processing**
- Verify **Request URL** in Slack App settings
- Check Render logs for Slack verification challenges

## Upgrading & Scaling

### Instance Types

| Type | Memory | CPU | Best For |
|------|--------|-----|----------|
| Free | 512 MB | Shared | Testing |
| Starter | 512 MB | 0.5 | Light production |
| Standard | 2 GB | 1 | Production |
| Pro | 4 GB | 2 | High traffic |

### Auto-Deploy

Enable automatic deployments:
1. Go to service **Settings**
2. Under **Build & Deploy**, enable **"Auto-Deploy"**
3. Every push to your branch triggers a new deployment

## Cost Optimization

1. **Free tier limitations:**
   - Spins down after 15 minutes of inactivity
   - Cold starts take 30-60 seconds

2. **For always-on service:**
   - Upgrade to Starter tier ($7/month minimum)
   - Or set up a health check ping to keep it active

## Security Best Practices

1. **Never commit secrets** to your repository
2. Use Render's **Secret Files** for sensitive configuration
3. Enable **HTTPS** (automatic on Render)
4. Regularly rotate API keys

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Mastra Documentation](mastra/) - In the same docs folder
- [Trigger Configuration](triggers/) - In the same docs folder

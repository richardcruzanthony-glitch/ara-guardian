# Deploying Ara Guardian to Render

This guide provides step-by-step instructions for deploying Ara Guardian to Render.com.

## Prerequisites

- A [Render](https://render.com) account
- Your repository connected to Render
- OpenAI API key (or compatible LLM provider)

## Environment Variables

Configure the following environment variables in your Render dashboard:

### Required Variables

- **`AI_API_KEY`**: Your authentication token for the chat API. If not set, authentication is disabled (for development only).
- **`OPENAI_API_KEY`**: Your OpenAI API key (or compatible provider).

### Optional Variables

- **`PORT`**: Server port (automatically set by Render, default: 5000)
- **`MEMORY_PATH`**: Path to the memory file for brain engine (default: `/tmp/us-complete.txt`)
  - On Render, use `/tmp/us-complete.txt` or another writable path
  - Repository source files are read-only on Render
- **`RENDER_MEMORY_PATH`**: Alternative to MEMORY_PATH, checked as fallback
- **`BRAIN_ENCRYPTION_KEY`**: Encryption key for memory (optional, 32 characters)
- **`BRAIN_ENCRYPTION_IV`**: Encryption IV for memory (optional, 16 characters)
- **`MASTRA_TELEMETRY_ENABLED`**: Telemetry status (always `false` - Iron Mode)

### Replit AI Integration (Optional)

If using Replit AI instead of OpenAI:
- **`AI_INTEGRATIONS_OPENAI_BASE_URL`**: Replit AI base URL
- **`AI_INTEGRATIONS_OPENAI_API_KEY`**: Replit AI API key

## Build Configuration

### Build Command
```bash
npm run build:render
```

or

```bash
bash build-render.sh
```

This script will:
1. Install dependencies
2. Compile TypeScript to `dist/`
3. Copy compiled files to `.mastra/output/src/`
4. Create the entry point at `.mastra/output/index.mjs`

### Start Command
```bash
npm run start:render
```

or

```bash
node .mastra/output/index.mjs
```

## Render Service Configuration

1. **Service Type**: Web Service
2. **Environment**: Node
3. **Build Command**: `bash build-render.sh`
4. **Start Command**: `node .mastra/output/index.mjs`
5. **Node Version**: 20.9.0 or higher (set in `package.json` engines)

## Memory File Configuration

The brain engine needs a writable location for the memory file. On Render:

1. Set `MEMORY_PATH=/tmp/us-complete.txt` in environment variables
2. The `/tmp` directory is writable but ephemeral (resets on deploys)
3. For persistent memory, consider:
   - Mounting a persistent disk (Render paid plans)
   - Using a database-backed storage solution
   - External storage service (S3, etc.)

## Initial Memory File

To seed the memory file on first run:
1. Place `us-complete.txt` in the repository root
2. The brain engine will check multiple locations:
   - `MEMORY_PATH` (environment variable)
   - Current working directory
   - `.mastra/output/`
   - `public/`
   - `/opt/render/project/src/`

## Security Notes

- **Never commit secrets**: Use Render's environment variable feature
- **Authentication**: Set `AI_API_KEY` in production to enable authentication
- **HTTPS**: Render provides automatic HTTPS for all web services
- **Rate Limiting**: Consider adding rate limiting for production deployments

## Testing Your Deployment

1. After deployment, visit your Render URL
2. You should see the "ARA Guardian Chat" interface
3. Test the chat functionality:
   - Without `AI_API_KEY` set: Authentication disabled (dev mode)
   - With `AI_API_KEY` set: Requests require Bearer token

## Troubleshooting

### Build Failures

- Check build logs in Render dashboard
- Ensure all TypeScript files compile without errors
- Verify `tsconfig.json` settings

### Runtime Errors

- Check application logs in Render dashboard
- Verify all environment variables are set correctly
- Check memory file path is writable

### Authorization Issues

- Ensure `AI_API_KEY` is set if authentication is required
- Check that the frontend receives the interpolated token value
- Verify Authorization header format: `Bearer <token>`

### Memory File Issues

- Ensure `MEMORY_PATH` points to a writable location (`/tmp/` recommended)
- Check file permissions
- Verify the adjuster tool can append to the file

## Monitoring

Render provides:
- Real-time logs
- Metrics dashboard
- Health check endpoints (configure at `/health` if needed)
- Auto-deploy on git push (optional)

## Scaling

For high-traffic deployments:
1. Upgrade to a paid Render plan for more resources
2. Configure auto-scaling if available
3. Consider adding a Redis cache for memory operations
4. Implement request queuing for agent operations

## Support

For issues specific to:
- **Render platform**: [Render Support](https://render.com/docs)
- **Ara Guardian**: Check repository issues
- **Mastra framework**: [Mastra Documentation](https://mastra.ai/docs)

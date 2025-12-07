#!/usr/bin/env bash

set -e

echo "Building for Render deployment..."

# Install dependencies
npm install

# Use TypeScript compiler to compile to dist/
echo "Compiling TypeScript..."
npx tsc

# Create output directory structure
echo "Creating .mastra/output structure..."
mkdir -p .mastra/output

# Copy compiled files from dist/ to .mastra/output/src/
echo "Copying compiled files..."
mkdir -p .mastra/output/src
cp -r dist/* .mastra/output/src/ 2>/dev/null || true

# Copy package files
echo "Copying package.json..."
cp package.json .mastra/output/
cp package-lock.json .mastra/output/ 2>/dev/null || true

# Create a simple index.mjs that starts the server
echo "Creating entry point..."
cat > .mastra/output/index.mjs << 'EOF'
import mastra from './src/mastra/index.js';
import { createNodeServer } from '@mastra/deployer/server';

const port = process.env.PORT || 5000;
console.log(`Starting Mastra server on port ${port}...`);

async function start() {
  try {
    await createNodeServer(mastra, { tools: {} });
    const serverConfig = mastra.getServer() ?? {};
    const host = serverConfig.host ?? '0.0.0.0';
    const serverPort = serverConfig.port ?? port;
    console.log(`[runtime] Mastra server listening on http://${host}:${serverPort}`);
  } catch (error) {
    console.error('[runtime] Failed to start Mastra server', error);
    process.exit(1);
  }
}

start();
EOF

# Create empty instrumentation file
touch .mastra/output/instrumentation.mjs

echo "Build complete!"
echo "Compiled files are in .mastra/output/"

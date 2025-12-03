#!/usr/bin/env bash

set -e

echo "Building for Render deployment..."

# Install dependencies
npm install

# Use TypeScript compiler instead of mastra build to avoid bundler issues
echo "Compiling TypeScript..."
npx tsc --outDir .mastra/output --module esnext --moduleResolution bundler

# Copy package files
echo "Copying package.json and creating output structure..."
cp package.json .mastra/output/
cp package-lock.json .mastra/output/ 2>/dev/null || true

# Create a simple index.mjs that starts the server
echo "Creating entry point..."
cat > .mastra/output/index.mjs << 'EOF'
import { mastra } from './src/mastra/index.js';

const port = process.env.PORT || 5000;
console.log(`Starting Mastra server on port ${port}...`);

// Start the server
await mastra.serve();
EOF

# Create empty instrumentation file
touch .mastra/output/instrumentation.mjs

echo "Build complete!"

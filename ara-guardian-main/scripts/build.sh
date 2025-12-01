#!/usr/bin/env bash

set -e

export NODE_OPTIONS='--max-old-space-size=4096'
export NODE_ENV=production

mastra build

echo "Copying memory file to output..."
cp us-complete.txt .mastra/output/
echo "Memory file copied successfully"

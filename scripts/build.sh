#!/usr/bin/env bash

set -e

export NODE_OPTIONS='--max-old-space-size=4096'
export NODE_ENV=production

exec mastra build

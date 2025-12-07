#!/usr/bin/env bash
set -euo pipefail

PORT=${1:-5001}
SUBDOMAIN=${2:-}
REPO_DIR="/c/ara-3"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found on PATH" >&2
  exit 1
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found on PATH. Run scripts/install-ngrok.sh first." >&2
  exit 1
fi

pushd "$REPO_DIR" >/dev/null

PORT=$PORT npm start &
SERVER_PID=$!

echo "Started Mastra server (PID $SERVER_PID) on port $PORT"

trap 'echo "Stopping server..."; kill $SERVER_PID >/dev/null 2>&1 || true' EXIT

sleep 4

bash scripts/start-ngrok.sh "$PORT" "$SUBDOMAIN"

wait $SERVER_PID

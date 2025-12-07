#!/usr/bin/env bash
set -euo pipefail

PORT=${1:-5000}
SUBDOMAIN=${2:-}

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not on PATH. Install it from https://ngrok.com/download and ensure 'ngrok' is available." >&2
  exit 1
fi

ARGS=(http "$PORT")
if [[ -n "$SUBDOMAIN" ]]; then
  ARGS+=(--subdomain "$SUBDOMAIN")
fi

echo "Starting ngrok on port $PORT..."
exec ngrok "${ARGS[@]}"

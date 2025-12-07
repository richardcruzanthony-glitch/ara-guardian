#!/usr/bin/env bash
set -euo pipefail

DEST_DIR=${1:-/c/tools/ngrok}
ZIP_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
TMP_ZIP=$(mktemp).zip

if command -v ngrok >/dev/null 2>&1; then
  echo "ngrok already installed at $(command -v ngrok)"
  exit 0
fi

echo "Downloading ngrok to $TMP_ZIP ..."
curl -L "$ZIP_URL" -o "$TMP_ZIP"

mkdir -p "$DEST_DIR"
echo "Extracting to $DEST_DIR ..."
unzip -o "$TMP_ZIP" -d "$DEST_DIR"
rm "$TMP_ZIP"

NGROK_PATH="$DEST_DIR/ngrok.exe"
if [[ ! -f "$NGROK_PATH" ]]; then
  echo "ngrok.exe not found in $DEST_DIR after extraction" >&2
  exit 1
fi

echo "ngrok installed at $NGROK_PATH"
echo "Add $DEST_DIR to your PATH if it isn't already."
echo "Example (PowerShell): setx PATH \"%PATH%;$DEST_DIR\""
echo "Then run: ngrok config add-authtoken <token>"

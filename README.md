# ara-guardian-main (scaffold)

This repository previously lacked a Node/TypeScript build. I scaffolded a
minimal TypeScript setup so you can run a basic build and verify the toolchain.

Quick start (PowerShell):

```powershell
cd c:\CProjectsmastra-bot\ara-guardian-main
npm install
npm run build
npm start
```

Notes:
- The scaffolded server listens on `PORT` (default `3000`).
- This is a minimal, non-invasive scaffold. If you have an existing
  `package.json` or a different build process, tell me and I will adapt.

## Local tunneling helper

We include `scripts/start-ngrok.ps1` to open an HTTPS tunnel so Telegram/webhooks
can reach your local Mastra server.

1. **Install ngrok**:
   - Download the Windows binary from <https://ngrok.com/download> and place
     `ngrok.exe` somewhere on your `PATH` (e.g., `C:\Windows\System32`).
   - Run once: `ngrok config add-authtoken <your-token>`.
2. **Start Mastra locally** (`PORT=5000 npm start`).
3. **Open a tunnel**:
   - PowerShell: `./scripts/start-ngrok.ps1 -Port 5000 -Subdomain myname`
   - Git Bash native script: `bash scripts/start-ngrok.sh 5000 myname`
   - Git Bash (if you need the PowerShell version):
     `powershell.exe -ExecutionPolicy Bypass -File scripts/start-ngrok.ps1 -Port 5000`

### One-command local runner

- PowerShell: `./scripts/run-local.ps1 -Port 5001 -Subdomain youralias`
- Git Bash: `bash scripts/run-local.sh 5001 youralias`

These launch the server and tunnel together (make sure ngrok is installed/authenticated first).

The script launches a new PowerShell window running `ngrok http <port>` and
prints the public HTTPS URL (use it like `https://xxxx.ngrok.io/telegram/webhook`).

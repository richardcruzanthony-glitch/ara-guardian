# ara-guardian-main (scaffold)

This repository previously lacked a Node/TypeScript build. I scaffolded a
minimal TypeScript setup so you can run a basic build and verify the toolchain.

## 🔒 Security Notice

**IMPORTANT:** This repository has been updated to remove hard-coded secrets and implement secure server-side authentication.

### What Changed
- ✅ Removed hard-coded Authorization bearer tokens from client-side code
- ✅ Implemented session-based authentication with HttpOnly cookies
- ✅ Added server-side API key management (keys stored in environment variables only)
- ✅ Added pre-commit hooks to prevent future secret commits
- ✅ Updated all examples to use placeholder values

### If You're Using This Repository
1. **Rotate any API keys** that may have been exposed
2. **Never commit secrets** to version control
3. **Enable GitHub secret scanning** in repository settings
4. **Use environment variables** for all sensitive configuration

## Quick Start

### Installation

```bash
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and set your actual values:
```bash
# REQUIRED: Generate a strong session secret
SESSION_SECRET=your-secure-session-secret-here

# Set your API keys (never commit these!)
CHAT_API_KEY=your-actual-api-key
AI_API_KEY=your-actual-ai-key
OPENAI_API_KEY=your-openai-key

# Optional: Set demo password for testing
DEMO_PASSWORD=your-secure-password

# Port configuration
PORT=3000
```

### Running the Application

#### Option 1: Mastra Server (TypeScript)
```bash
npm run build
npm start
```

#### Option 2: Express Server (Session-based Authentication)
```bash
npm run server
```

The server will be available at `http://localhost:3000` (or the PORT you configured).

### Testing Authentication

1. Start the server: `npm run server`
2. Login via API:
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"password":"demo123"}' \
  -c cookies.txt
```

3. Test authenticated chat:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"message":"Hello, ARA!"}'
```

## Security Best Practices

### 🔐 Preventing Secret Leaks

This repository includes a pre-commit hook that scans for potential secrets before allowing commits. The hook will block commits containing:
- API keys and tokens
- Private keys
- Passwords in configuration
- Bearer tokens
- AWS credentials
- And more...

### Rotating Compromised Keys

If a secret was accidentally committed:

1. **Immediately rotate the compromised key/token**
2. **Remove the secret from git history**:

#### Using BFG Repo-Cleaner (Recommended)
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

#### Using git-filter-repo
```bash
# Install: pip install git-filter-repo
git filter-repo --invert-paths --path-regex 'pattern-to-remove'
git push --force
```

3. **Force all users to re-clone**: Notify collaborators that history has been rewritten

### GitHub Secret Scanning

Enable GitHub's secret scanning in your repository:
1. Go to Settings → Security & analysis
2. Enable "Secret scanning"
3. Enable "Push protection" to block commits with secrets

### Environment Variable Management

**Production Deployment:**
- Use your platform's environment variable management (e.g., Render, Heroku, AWS)
- Never commit `.env` files
- Use secrets management services (AWS Secrets Manager, HashiCorp Vault, etc.)

**Local Development:**
- Keep `.env` in `.gitignore` (already configured)
- Use `.env.example` as a template
- Generate strong secrets: `openssl rand -base64 32`

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

## Architecture

### Session-Based Authentication
- Client sends credentials to `/login`
- Server validates and creates session with HttpOnly cookie
- All API requests include session cookie (`credentials: 'include'`)
- Server validates session before processing requests

### API Endpoints
- `POST /login` - Authenticate and create session
- `POST /logout` - Destroy session
- `POST /api/chat` - Chat endpoint (requires authentication)
- `GET /health` - Health check endpoint

## Contributing

Before committing:
1. Ensure no secrets are in your changes
2. Test the pre-commit hook: `git commit` (it will scan automatically)
3. If the hook blocks your commit, review and remove any secrets

## License

ISC


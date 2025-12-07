# Security Testing Guide

This guide documents how to test the security fixes implemented in this repository.

## Prerequisites

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env and set actual values
```

## Test 1: Verify No Hard-coded Secrets in Source Files

**Purpose:** Ensure no secrets are present in the codebase

```bash
# Search for the old hard-coded secret
grep -r "supersecretkey" src/ mastra.config.ts public/

# Expected: No results (exit code 1)
# If any results are found, the security fix is incomplete
```

**Expected Output:**
```
(no output - grep should find nothing)
```

## Test 2: Verify No Authorization Headers in Client Code

**Purpose:** Ensure client-side code doesn't send Authorization headers

```bash
# Search for Authorization headers in client code
grep -r "Authorization.*Bearer" src/ mastra.config.ts public/

# Expected: No results in client-facing code
```

**Expected Output:**
```
(no output in client HTML/JS code)
```

## Test 3: Test Pre-commit Hook Blocks Secrets

**Purpose:** Verify the pre-commit hook detects and blocks secrets

```bash
# Create a test file with a secret
echo 'const API_KEY = "supersecretkey";' > test-secret.js

# Try to commit it
git add test-secret.js
git commit -m "test commit with secret"

# Expected: Commit should be BLOCKED
```

**Expected Output:**
```
🔍 Scanning for secrets...
const API_KEY = "supersecretkey";

❌ COMMIT BLOCKED: Potential secrets detected in staged files!

Please review the flagged content and ensure no secrets are committed.
```

**Cleanup:**
```bash
git reset HEAD test-secret.js
rm test-secret.js
```

## Test 4: Test Session Authentication (Express Server)

### Step 4a: Start the Server

```bash
# Ensure .env is configured with SESSION_SECRET and DEMO_PASSWORD
npm run server
```

**Expected Output:**
```
Server running on port 3000
Environment: development
```

### Step 4b: Test Unauthenticated Request (Should Fail)

```bash
# Try to use chat API without authentication
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

**Expected Output:**
```json
{"error":"Unauthorized. Please login first."}
```

**Status Code:** 401 Unauthorized

### Step 4c: Test Login

```bash
# Login with demo password
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"password":"demo123"}' \
  -c cookies.txt \
  -v
```

**Expected Output:**
```json
{"success":true,"message":"Logged in successfully"}
```

**Verify:** Response should include `Set-Cookie` header with session cookie

### Step 4d: Test Authenticated Request (Should Succeed)

```bash
# Use chat API with session cookie
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"message":"Hello ARA"}'
```

**Expected Output:**
```json
{"text":"Echo from server (authenticated user demo-user): Hello ARA"}
```

**Status Code:** 200 OK

### Step 4e: Test Logout

```bash
# Logout
curl -X POST http://localhost:3000/logout \
  -b cookies.txt
```

**Expected Output:**
```json
{"success":true,"message":"Logged out successfully"}
```

### Step 4f: Verify Session is Destroyed

```bash
# Try to use API after logout (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"message":"Hello"}'
```

**Expected Output:**
```json
{"error":"Unauthorized. Please login first."}
```

## Test 5: Verify Session Cookie is HttpOnly

**Purpose:** Ensure session cookies cannot be accessed via JavaScript

```bash
# Check Set-Cookie header includes HttpOnly flag
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"password":"demo123"}' \
  -v 2>&1 | grep Set-Cookie
```

**Expected Output:**
```
Set-Cookie: connect.sid=...; Path=/; HttpOnly
```

**Verify:** The cookie must have the `HttpOnly` flag

## Test 6: Test Rate Limiting

**Purpose:** Verify rate limiting protects against brute force

```bash
# Send many requests quickly (requires bash loop)
for i in {1..105}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}' \
    -s -o /dev/null -w "%{http_code}\n"
done
```

**Expected Output:**
- First ~100 requests: Status code 401 (Unauthorized - no session)
- After 100 requests: Status code 429 (Too Many Requests)

## Test 7: Verify Environment Variables Required

**Purpose:** Ensure application doesn't run with hard-coded defaults

```bash
# Remove environment variables and try to start server
unset AI_API_KEY
unset SESSION_SECRET
npm run server
```

**Expected Output:**
```
Server running on port 3000
WARNING: Using default SESSION_SECRET. Set SESSION_SECRET in environment for production!
WARNING: CHAT_API_KEY not set. Set CHAT_API_KEY in environment!
```

**Note:** Server should warn about missing configuration but not expose defaults

## Test 8: Verify .env is Ignored by Git

**Purpose:** Ensure .env files are not committed

```bash
# Create a .env file with a secret
echo 'SECRET_KEY=my-secret' > .env

# Check git status
git status

# Expected: .env should NOT appear in untracked files
```

**Expected Output:**
```
(no mention of .env file)
```

**Verify:**
```bash
# Confirm .env is in .gitignore
grep "^\.env$" .gitignore
```

## Test 9: Test Pre-commit Hook with Various Secret Patterns

**Purpose:** Verify hook detects different types of secrets

```bash
# Test various secret patterns
echo 'const key = "supersecretkey";' > test1.js
echo 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE' > test2.js
echo 'token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"' > test3.js

git add test1.js test2.js test3.js
git commit -m "test secrets"

# Expected: All should be detected and blocked
```

**Cleanup:**
```bash
git reset HEAD test*.js
rm test*.js
```

## Test 10: Security Headers Check

**Purpose:** Verify Helmet security headers are applied

```bash
# Check security headers
curl -I http://localhost:3000/

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY or SAMEORIGIN
# X-XSS-Protection: 0 (or not present, modern browsers don't need it)
```

## Summary Checklist

Run through these checks to verify all security fixes are working:

- [ ] No hard-coded secrets in source files (Test 1)
- [ ] No Authorization headers in client code (Test 2)
- [ ] Pre-commit hook blocks secrets (Test 3)
- [ ] Unauthenticated requests are blocked (Test 4b)
- [ ] Login creates session (Test 4c)
- [ ] Authenticated requests work (Test 4d)
- [ ] Logout destroys session (Test 4e-4f)
- [ ] Session cookies are HttpOnly (Test 5)
- [ ] Rate limiting works (Test 6)
- [ ] Application warns about missing env vars (Test 7)
- [ ] .env files are gitignored (Test 8)
- [ ] Pre-commit hook detects various secrets (Test 9)
- [ ] Security headers are present (Test 10)

## Troubleshooting

### Pre-commit Hook Not Running

```bash
# Ensure the hook is executable
chmod +x .husky/pre-commit

# Test the hook directly
.husky/pre-commit
```

### Dependencies Not Installing

```bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or ignore scripts if inngest-cli fails
npm install --ignore-scripts
```

### Server Not Starting

```bash
# Check Node version
node --version  # Should be >= 20.9.0

# Check for syntax errors
node --check server/index.js

# Run with more logging
DEBUG=* npm run server
```

## Reporting Security Issues

If you find a security issue during testing:
1. Do NOT create a public issue
2. Use GitHub's private vulnerability reporting
3. Email the repository owner directly
4. Provide details about the vulnerability and steps to reproduce

---

**Last Updated:** December 2025

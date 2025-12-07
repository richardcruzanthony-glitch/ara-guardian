# Security Remediation Guide

## 🔒 Security Issues Addressed

This document details the security vulnerabilities that were found and remediated in this repository.

### Critical Issue: Hard-coded Secrets in Client-Side Code

**Vulnerability:** The repository contained a hard-coded API key/token (`supersecretkey`) that was:
1. Embedded in client-side HTML/JavaScript sent to browsers
2. Used as a default fallback value when environment variables were not set
3. Sent in HTTP Authorization headers from the browser
4. Visible to anyone who viewed the page source or network traffic

**Impact:** HIGH - Any user could extract the token and use it to make unauthorized requests to the API.

**Files Affected:**
- `src/mastra/index.ts` (line 25, 96, 122)
- `mastra.config.ts` (line 25, 98, 131)

### Remediation Actions Taken

#### 1. ✅ Removed Hard-coded Secrets
- Removed the default fallback value `|| "supersecretkey"`
- Changed `const AI_API_KEY = process.env.AI_API_KEY || "supersecretkey"` to `const AI_API_KEY = process.env.AI_API_KEY`
- The application will now fail gracefully if API keys are not configured, rather than using an insecure default

#### 2. ✅ Removed Client-Side Authorization Headers
- Removed `'Authorization': 'Bearer ${AI_API_KEY}'` from all client-side fetch calls
- Updated all HTML templates to not expose server-side secrets
- Changed to session-based authentication using HttpOnly cookies

#### 3. ✅ Implemented Session-Based Authentication
- Created `server/index.js` with Express server
- Added `express-session` with HttpOnly cookies
- Implemented `/login` endpoint for authentication
- Added session validation middleware for protected routes
- All API keys now stay on the server side only

#### 4. ✅ Added Security Middleware
- **helmet**: Adds security headers to prevent XSS, clickjacking, etc.
- **rate-limiter**: Prevents brute force attacks (100 requests per 15 minutes)
- **express-session**: Secure session management with configurable secrets

#### 5. ✅ Created Pre-commit Hook
- Scans staged files for common secret patterns before allowing commits
- Blocks commits containing:
  - Private keys
  - AWS credentials
  - API keys
  - GitHub tokens
  - Bearer tokens
  - The previous "supersecretkey" pattern

#### 6. ✅ Updated Documentation
- Added security best practices to README.md
- Created this security remediation guide
- Added instructions for rotating compromised keys
- Documented proper environment variable usage

## 🔄 Required Actions for Repository Owners

### Immediate Actions (REQUIRED)

1. **Rotate the Compromised Key**
   - The value "supersecretkey" was committed to the repository
   - If this was ever used as a real API key, it must be rotated immediately
   - Generate a new, strong API key for any affected services
   - Update the new key in your deployment environment variables only (never in code)

2. **Remove Secrets from Git History**
   
   The hard-coded secret exists in git history and should be removed:

   **Option A: Using BFG Repo-Cleaner (Recommended)**
   ```bash
   # Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
   # Create a file with secrets to remove
   echo "supersecretkey" > passwords.txt
   
   # Run BFG to remove the secret from all commits
   java -jar bfg.jar --replace-text passwords.txt
   
   # Clean up git objects
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push (WARNING: This rewrites history)
   git push --force --all
   ```

   **Option B: Using git-filter-repo**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo
   
   # Remove the secret from all commits
   git filter-repo --replace-text <(echo "supersecretkey==>REDACTED")
   
   # Force push (WARNING: This rewrites history)
   git push --force --all
   ```

3. **Notify All Collaborators**
   - After rewriting history, all collaborators must re-clone the repository
   - Send notification: "Git history has been rewritten to remove secrets. Please re-clone the repository."

4. **Enable GitHub Secret Scanning**
   - Go to repository Settings → Security & analysis
   - Enable "Secret scanning"
   - Enable "Push protection" to prevent future secret commits

### Configuration Actions (REQUIRED)

1. **Set Environment Variables**
   
   For each deployment environment (production, staging, etc.), set:
   ```bash
   SESSION_SECRET=<generate-with-openssl-rand-base64-32>
   CHAT_API_KEY=<your-actual-api-key>
   AI_API_KEY=<your-actual-api-key>
   OPENAI_API_KEY=<your-openai-key>
   DEMO_PASSWORD=<secure-password-for-demo>
   ```

   **Generate secure secrets:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update Deployment Configuration**
   
   **Render/Heroku/Similar:**
   - Add environment variables in the dashboard
   - Never commit `.env` files

   **Docker:**
   - Use secrets management or `.env` files mounted at runtime
   - Never include `.env` in Docker images

   **Kubernetes:**
   - Use Secrets or ConfigMaps
   - Consider external secrets management (AWS Secrets Manager, HashiCorp Vault)

### Verification Actions (REQUIRED)

1. **Verify No Secrets in Codebase**
   ```bash
   # Search for potential secrets
   grep -r "supersecretkey" .
   grep -r "Bearer.*[A-Za-z0-9]" . --include="*.js" --include="*.ts"
   grep -r "password.*=" . --include="*.js" --include="*.ts"
   ```

2. **Test Pre-commit Hook**
   ```bash
   # Create a test file with a secret
   echo 'const key = "supersecretkey"' > test-secret.js
   git add test-secret.js
   git commit -m "test"
   # Should be blocked by pre-commit hook
   rm test-secret.js
   ```

3. **Verify Session Authentication Works**
   ```bash
   # Start the server
   npm run server
   
   # Try chat without authentication (should fail)
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   
   # Login and get session cookie
   curl -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"password":"demo123"}' \
     -c cookies.txt
   
   # Try chat with session (should succeed)
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d '{"message":"test"}'
   ```

## 🛡️ Security Best Practices Going Forward

### For Developers

1. **Never commit secrets**
   - Use `.env` files locally (already in `.gitignore`)
   - Use environment variables in production
   - Use the `.env.example` template

2. **Review pre-commit warnings**
   - The pre-commit hook will scan for secrets
   - Don't bypass it with `--no-verify` unless you're certain

3. **Use strong secrets**
   - Generate with `openssl rand -base64 32`
   - Use different secrets for each environment
   - Rotate secrets periodically

4. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update vulnerable dependencies promptly

### For Deployment

1. **Use secrets management services**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Secret Manager

2. **Enable security scanning**
   - GitHub secret scanning and push protection
   - Dependabot for vulnerability alerts
   - SAST tools like CodeQL

3. **Implement least privilege**
   - API keys should have minimal required permissions
   - Use separate keys for different services
   - Rotate keys regularly

4. **Monitor for breaches**
   - Enable GitHub security alerts
   - Monitor logs for unusual activity
   - Set up alerts for failed authentication attempts

## 📋 Checklist for Repository Owners

- [ ] Rotate the `supersecretkey` if it was ever used as a real key
- [ ] Remove secrets from git history using BFG or git-filter-repo
- [ ] Force push cleaned history to all branches
- [ ] Notify all collaborators to re-clone
- [ ] Enable GitHub secret scanning and push protection
- [ ] Set environment variables in all deployment environments
- [ ] Test that the application works with environment variables
- [ ] Test that the pre-commit hook blocks secrets
- [ ] Test that session authentication works
- [ ] Document the incident (date, what was exposed, what was done)
- [ ] Review all API keys and rotate any that may have been exposed
- [ ] Monitor API logs for unusual activity using the old key

## 🔗 Additional Resources

- [GitHub Secret Scanning Documentation](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 📞 Support

If you have questions about this remediation or need help implementing the fixes, please:
1. Review this document thoroughly
2. Check the README.md for setup instructions
3. Open an issue in the repository with specific questions
4. For security concerns, use GitHub's private vulnerability reporting

---

**Last Updated:** December 2025
**Remediation Version:** 1.0

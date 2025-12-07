#!/bin/bash

# Security Verification Script
# Run this script to verify all security fixes are in place

echo "🔍 Ara Guardian Security Verification"
echo "======================================"
echo ""

FAILED=0

# Test 1: Check for hard-coded secrets in source files
echo "Test 1: Checking for hard-coded secrets in source files..."
if grep -r "supersecretkey" src/ mastra.config.ts public/ 2>/dev/null; then
  echo "❌ FAILED: Hard-coded secret 'supersecretkey' found in source files!"
  FAILED=1
else
  echo "✅ PASSED: No hard-coded 'supersecretkey' found"
fi
echo ""

# Test 2: Check for Authorization headers in client code
echo "Test 2: Checking for Authorization headers in client code..."
if grep -E "Authorization.*Bearer" src/mastra/index.ts mastra.config.ts public/app.js 2>/dev/null | grep -v "//"; then
  echo "❌ FAILED: Hard-coded Authorization headers found in client code!"
  FAILED=1
else
  echo "✅ PASSED: No hard-coded Authorization headers in client code"
fi
echo ""

# Test 3: Check credentials: 'include' is present
echo "Test 3: Checking for session-based authentication (credentials: 'include')..."
if grep -q "credentials.*include" public/app.js && grep -q "credentials.*include" src/mastra/index.ts; then
  echo "✅ PASSED: Session-based authentication configured"
else
  echo "❌ FAILED: Session-based authentication not properly configured"
  FAILED=1
fi
echo ""

# Test 4: Check pre-commit hook exists
echo "Test 4: Checking pre-commit hook exists and is executable..."
if [ -x .husky/pre-commit ]; then
  echo "✅ PASSED: Pre-commit hook exists and is executable"
else
  echo "❌ FAILED: Pre-commit hook missing or not executable"
  FAILED=1
fi
echo ""

# Test 5: Check .env.example exists and has no real secrets
echo "Test 5: Checking .env.example is safe..."
if [ -f .env.example ]; then
  if grep -q "your-.*-here\|placeholder\|example" .env.example; then
    echo "✅ PASSED: .env.example contains placeholder values"
  else
    echo "⚠️  WARNING: .env.example might contain real secrets"
  fi
else
  echo "❌ FAILED: .env.example not found"
  FAILED=1
fi
echo ""

# Test 6: Check .env is in .gitignore
echo "Test 6: Checking .env is in .gitignore..."
if grep -q "^\.env$" .gitignore; then
  echo "✅ PASSED: .env is in .gitignore"
else
  echo "❌ FAILED: .env is not in .gitignore"
  FAILED=1
fi
echo ""

# Test 7: Check security documentation exists
echo "Test 7: Checking security documentation..."
if [ -f SECURITY.md ] && [ -f TESTING.md ] && [ -f README.md ]; then
  echo "✅ PASSED: Security documentation exists"
else
  echo "❌ FAILED: Missing security documentation"
  FAILED=1
fi
echo ""

# Test 8: Check server/index.js exists with security middleware
echo "Test 8: Checking Express server with security middleware..."
if [ -f server/index.js ]; then
  if grep -q "helmet" server/index.js && grep -q "express-session" server/index.js && grep -q "rateLimit" server/index.js; then
    echo "✅ PASSED: Express server has security middleware"
  else
    echo "❌ FAILED: Express server missing security middleware"
    FAILED=1
  fi
else
  echo "❌ FAILED: server/index.js not found"
  FAILED=1
fi
echo ""

# Test 9: Check AI_API_KEY has no default fallback
echo "Test 9: Checking AI_API_KEY has no insecure default..."
if grep "AI_API_KEY.*supersecretkey" src/mastra/index.ts mastra.config.ts 2>/dev/null; then
  echo "❌ FAILED: AI_API_KEY still has insecure default"
  FAILED=1
else
  echo "✅ PASSED: AI_API_KEY has no insecure default"
fi
echo ""

# Summary
echo "======================================"
if [ $FAILED -eq 0 ]; then
  echo "✅ ALL SECURITY CHECKS PASSED"
  echo ""
  echo "Next steps:"
  echo "1. Rotate any API keys that may have been exposed"
  echo "2. Remove secrets from git history (see SECURITY.md)"
  echo "3. Set environment variables in your deployment"
  echo "4. Enable GitHub secret scanning"
  exit 0
else
  echo "❌ SOME SECURITY CHECKS FAILED"
  echo ""
  echo "Please review the failed checks above and fix the issues."
  exit 1
fi

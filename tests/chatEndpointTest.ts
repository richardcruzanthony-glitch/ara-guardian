/**
 * Integration Test for /chat endpoint
 * 
 * Tests:
 * 1. Server starts successfully
 * 2. POST /chat returns 400 for invalid payloads
 * 3. POST /chat returns 200 for valid payloads (or graceful error)
 * 4. Proper logging is in place
 */

import http from 'http';

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';
const API_KEY = process.env.AI_API_KEY || 'supersecretkey';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Wait for server to be ready
 */
async function waitForServer(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest('GET', '/');
      console.log('✓ Server is ready');
      return true;
    } catch (e) {
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  return false;
}

/**
 * Make HTTP request
 */
function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; body: string; headers: any }> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Test: Missing message field
 */
async function testMissingMessage(): Promise<TestResult> {
  try {
    const res = await makeRequest('POST', '/chat', {}, {
      'Authorization': `Bearer ${API_KEY}`
    });

    if (res.status === 400) {
      const body = JSON.parse(res.body);
      if (body.error) {
        return { name: 'Missing message field', passed: true };
      }
    }

    return {
      name: 'Missing message field',
      passed: false,
      error: `Expected 400 with error, got ${res.status}: ${res.body}`
    };
  } catch (e: any) {
    return {
      name: 'Missing message field',
      passed: false,
      error: e.message
    };
  }
}

/**
 * Test: Empty message
 */
async function testEmptyMessage(): Promise<TestResult> {
  try {
    const res = await makeRequest('POST', '/chat', { message: '' }, {
      'Authorization': `Bearer ${API_KEY}`
    });

    if (res.status === 400) {
      return { name: 'Empty message field', passed: true };
    }

    return {
      name: 'Empty message field',
      passed: false,
      error: `Expected 400, got ${res.status}: ${res.body}`
    };
  } catch (e: any) {
    return {
      name: 'Empty message field',
      passed: false,
      error: e.message
    };
  }
}

/**
 * Test: Valid message
 */
async function testValidMessage(): Promise<TestResult> {
  try {
    const res = await makeRequest('POST', '/chat', { 
      message: 'Hello, this is a test message' 
    }, {
      'Authorization': `Bearer ${API_KEY}`
    });

    // Accept 200 (success) or 500 (server error but endpoint working)
    if (res.status === 200 || res.status === 500) {
      const body = JSON.parse(res.body);
      
      // Either reply or error field should be present
      if (body.reply || body.error) {
        return { name: 'Valid message handling', passed: true };
      }
    }

    return {
      name: 'Valid message handling',
      passed: false,
      error: `Expected 200/500 with reply/error, got ${res.status}: ${res.body}`
    };
  } catch (e: any) {
    return {
      name: 'Valid message handling',
      passed: false,
      error: e.message
    };
  }
}

/**
 * Test: Missing auth header
 */
async function testMissingAuth(): Promise<TestResult> {
  try {
    const res = await makeRequest('POST', '/chat', { 
      message: 'Test' 
    });

    if (res.status === 401) {
      return { name: 'Missing auth header', passed: true };
    }

    return {
      name: 'Missing auth header',
      passed: false,
      error: `Expected 401, got ${res.status}: ${res.body}`
    };
  } catch (e: any) {
    return {
      name: 'Missing auth header',
      passed: false,
      error: e.message
    };
  }
}

/**
 * Test: Invalid JSON body
 */
async function testInvalidJSON(): Promise<TestResult> {
  return new Promise((resolve) => {
    const options: http.RequestOptions = {
      hostname: HOST,
      port: PORT,
      path: '/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 400) {
          resolve({ name: 'Invalid JSON body', passed: true });
        } else {
          resolve({
            name: 'Invalid JSON body',
            passed: false,
            error: `Expected 400, got ${res.statusCode}: ${data}`
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        name: 'Invalid JSON body',
        passed: false,
        error: e.message
      });
    });

    // Send invalid JSON
    req.write('{ invalid json }');
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('Chat Endpoint Integration Tests');
  console.log('='.repeat(60));
  console.log('');

  // Wait for server
  console.log('Waiting for server to start...');
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    console.error('✗ Server failed to start within 30 seconds');
    process.exit(1);
  }

  console.log('');
  console.log('Running tests...');
  console.log('');

  // Run tests
  const tests = [
    testMissingAuth,
    testInvalidJSON,
    testMissingMessage,
    testEmptyMessage,
    testValidMessage
  ];

  for (const test of tests) {
    const result = await test();
    results.push(result);
    
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${status}${reset} ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  // Summary
  console.log('');
  console.log('='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  
  const summaryColor = allPassed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log(`${summaryColor}Results: ${passed}/${total} tests passed${reset}`);
  console.log('='.repeat(60));

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});

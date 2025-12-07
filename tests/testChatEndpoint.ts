/**
 * Test Script for Chat Endpoint
 *
 * This script tests that the chat endpoint properly:
 * - Accepts messages via POST /chat
 * - Validates authorization
 * - Routes to the registered agent
 * - Calls agent.generateLegacy() correctly
 * - Returns responses
 *
 * PREREQUISITES:
 * 1. Valid OpenAI API key in AI_INTEGRATIONS_OPENAI_API_KEY env var
 * 2. Mastra server running (npm start)
 *
 * HOW TO RUN:
 * npx tsx tests/testChatEndpoint.ts
 */

const API_URL = process.env.API_URL || "http://localhost:5000";
// Use env var or default test key (matches default in src/mastra/index.ts)
const API_KEY = process.env.AI_API_KEY || "supersecretkey";

async function testChatEndpoint() {
  console.log("Testing ARA Guardian Chat Endpoint...\n");

  // Test 1: Unauthorized request
  console.log("Test 1: Testing unauthorized request...");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "HELLO" }),
    });
    
    if (response.status === 401) {
      console.log("✅ Unauthorized request properly rejected\n");
    } else {
      console.log(`❌ Expected 401, got ${response.status}\n`);
    }
  } catch (error) {
    console.error("❌ Test 1 failed:", error);
  }

  // Test 2: Authorized request
  console.log("Test 2: Testing authorized request...");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ message: "HELLO" }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Request successful");
      console.log("Response:", data);
      
      if (data.reply && data.reply !== "No response") {
        console.log("✅ Received valid reply from agent\n");
      } else if (data.reply === "ARA could not process your message") {
        console.log("⚠️  Agent failed to process (likely API key issue)\n");
      } else {
        console.log("⚠️  Received unexpected reply format\n");
      }
    } else {
      const error = await response.json();
      console.log(`❌ Request failed with status ${response.status}`);
      console.log("Error:", error, "\n");
    }
  } catch (error) {
    console.error("❌ Test 2 failed:", error);
  }

  // Test 3: Empty message
  console.log("Test 3: Testing empty message handling...");
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ message: "" }),
    });

    if (response.status === 400) {
      console.log("✅ Empty message properly rejected\n");
    } else {
      console.log(`❌ Expected 400, got ${response.status}\n`);
    }
  } catch (error) {
    console.error("❌ Test 3 failed:", error);
  }

  console.log("\nTest suite completed!");
}

// Run the tests
testChatEndpoint().catch(console.error);

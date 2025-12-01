/**
 * Test Script for Time-Based (Cron) Workflows
 *
 * This script demonstrates the CORRECT way to test time-based workflows
 * that use Inngest for orchestration. It simulates a cron schedule firing.
 *
 * WHAT THIS TESTS:
 * - Manual trigger of cron workflow (replit/cron.trigger event)
 * - Workflow execution without waiting for schedule
 * - Complete Inngest step-by-step orchestration
 * - Fast feedback loop for cron automation development
 *
 * PREREQUISITES:
 * 1. Start your Mastra server: npm start (runs on localhost:5000)
 * 2. Start Inngest dev server: inngest dev -u http://localhost:5000/api/inngest --port 3000
 *
 * HOW TO RUN:
 * npx tsx tests/testCronAutomation.ts
 *
 * VERIFICATION:
 * - Check console output for success messages
 * - Visit http://localhost:3000 to see execution in Inngest dashboard
 */

import { inngest } from "../src/mastra/inngest/client";

// ============================================================================
// TEST FUNCTION
// ============================================================================

async function testCronTrigger() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🚀 CRON AUTOMATION TEST`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Trigger Type: Time-Based (Cron)\n`);

  try {
    /**
     * Send an Inngest event that simulates a cron schedule firing.
     *
     * In production, the flow is:
     * 1. Inngest Cloud evaluates cron expression and fires at scheduled time
     * 2. Inngest Cloud → triggers the cron function (id: "cron-trigger")
     * 3. Cron function → starts workflow with empty inputData
     * 4. Workflow → orchestrated by Inngest step-by-step
     *
     * This test simulates step 1-2, allowing you to test your cron workflow
     * immediately without waiting for the actual schedule.
     *
     * Note: The cron function also listens to this manual trigger event,
     * so you can test at any time during development.
     */
    await inngest.send({
      // Event name that cron triggers listen for (see registerCronWorkflow)
      name: "replit/cron.trigger",

      // Cron workflows don't receive external input, so data is empty
      data: {},
    });

    console.log(`✅ Cron trigger event sent successfully!`);
    console.log(`\n📊 Check execution at: http://localhost:3000`);
    console.log(`   - Functions tab: Look for "cron-trigger"`);
    console.log(`   - Runs tab: See the complete execution trace`);
    console.log(
      `\n💡 TIP: Your workflow will execute immediately, no need to wait for the schedule!\n`,
    );
  } catch (error) {
    console.error("❌ Error sending Inngest event:", error);
    console.error("\nTroubleshooting:");
    console.error("  1. Is your Mastra server running? (npm start)");
    console.error(
      "  2. Is Inngest dev server running? (inngest dev -u http://localhost:5000/api/inngest --port 3000)",
    );
    console.error(
      "  3. Is registerCronTrigger called in src/mastra/index.ts?\n",
    );
    process.exit(1);
  }
}

// Run the test
testCronTrigger();

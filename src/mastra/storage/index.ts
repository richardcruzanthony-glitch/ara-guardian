import { PostgresStore } from "@mastra/pg";

// Shared Postgres storage instance
export const storage = new PostgresStore({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/mastra",
});

// Required by Mastra runtime — prevents __setTelemetry error
// Mastra checks for this method during initialization.
(storage as any).__setTelemetry = function () {
  // No-op — Mastra only checks that this function exists
};

import { PostgresStore } from "@mastra/pg";

// Patch PostgresStore to add the telemetry hook Mastra now requires
class PatchedPostgresStore extends PostgresStore {
  __setTelemetry(telemetry: any) {
    // Mastra calls this internally — storing it is enough
    this.telemetry = telemetry;
  }
}

// Export a single shared PostgreSQL storage instance
export const sharedPostgresStorage = new PatchedPostgresStore({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/mastra",
});

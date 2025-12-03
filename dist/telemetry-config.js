// src/telemetry-config.ts
// This file is loaded by Mastra CLI during bundling — kills telemetry forever
process.env.MASTRA_TELEMETRY_ENABLED = "false";
export const telemetryConfig = {
    enabled: false,
    projectId: "none",
    apiKey: "none",
};
export default telemetryConfig;

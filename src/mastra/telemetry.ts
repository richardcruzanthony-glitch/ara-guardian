// This file is loaded by Mastra CLI during bundling
// It kills the telemetry module before it generates the broken config
process.env.MASTRA_TELEMETRY_ENABLED = "false";

// Centralized configuration for Ara Guardian
// This file exports all environment-based configuration values

/**
 * API key for authentication. If not set, authentication is disabled in development.
 */
export const AI_API_KEY = process.env.AI_API_KEY || '';

/**
 * Memory file path. Configurable via MEMORY_PATH or RENDER_MEMORY_PATH.
 * Defaults to /tmp/us-complete.txt for safe writable access on managed hosts.
 */
export const MEMORY_PATH = process.env.MEMORY_PATH || process.env.RENDER_MEMORY_PATH || '/tmp/us-complete.txt';

/**
 * Application server port. Defaults to 5000 if PORT is not set.
 */
export const APP_PORT = parseInt(process.env.PORT || '5000', 10);

/**
 * Brain encryption key for memory encryption (optional)
 */
export const BRAIN_ENCRYPTION_KEY = process.env.BRAIN_ENCRYPTION_KEY || 'ara-brain-default-key-32chars!';

/**
 * Brain encryption IV for memory encryption (optional)
 */
export const BRAIN_ENCRYPTION_IV = process.env.BRAIN_ENCRYPTION_IV || '1234567890123456';

/**
 * Check if authentication is required.
 * Returns true if AI_API_KEY is set, false otherwise.
 */
export function authRequired(): boolean {
  return AI_API_KEY.length > 0;
}

/**
 * Telemetry is always disabled (Iron Mode)
 */
export const MASTRA_TELEMETRY_ENABLED = 'false';

// Set telemetry environment variable
process.env.MASTRA_TELEMETRY_ENABLED = MASTRA_TELEMETRY_ENABLED;

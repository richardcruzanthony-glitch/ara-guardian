// Simple console logger utility with timestamps
// Provides consistent logging format across the application
/**
 * Get current timestamp in ISO format
 */
function getTimestamp() {
    return new Date().toISOString();
}
/**
 * Log debug message with timestamp
 */
export function debug(message, ...args) {
    console.log(`[${getTimestamp()}] [DEBUG] ${message}`, ...args);
}
/**
 * Log info message with timestamp
 */
export function info(message, ...args) {
    console.log(`[${getTimestamp()}] [INFO] ${message}`, ...args);
}
/**
 * Log warning message with timestamp
 */
export function warn(message, ...args) {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, ...args);
}
/**
 * Log error message with timestamp and stack trace
 */
export function error(message, err) {
    if (err?.stack) {
        console.error(`[${getTimestamp()}] [ERROR] ${message}`, err.stack);
    }
    else if (err) {
        console.error(`[${getTimestamp()}] [ERROR] ${message}`, err);
    }
    else {
        console.error(`[${getTimestamp()}] [ERROR] ${message}`);
    }
}
/**
 * Console logger wrapper for structured logging
 */
export const logger = {
    debug,
    info,
    warn,
    error,
};

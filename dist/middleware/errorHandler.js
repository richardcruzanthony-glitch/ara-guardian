/**
 * Global error handler middleware for Hono/Mastra
 *
 * Provides comprehensive error logging and safe error responses
 * that don't leak sensitive information in production.
 */
/**
 * Global error handler that catches unhandled errors in routes
 *
 * Features:
 * - Logs full error details server-side
 * - Returns safe error responses to clients
 * - Hides stack traces in production
 * - Provides detailed errors in development
 */
export async function errorHandler(c, next) {
    try {
        await next();
    }
    catch (error) {
        const isProduction = process.env.NODE_ENV === 'production';
        // Log full error details server-side
        console.error('[ErrorHandler] Unhandled error:', {
            url: c.req.url,
            method: c.req.method,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        // Return safe error response to client
        return c.json({
            error: 'Internal server error',
            message: isProduction ? 'An unexpected error occurred' : error.message,
            stack: isProduction ? undefined : error.stack,
            timestamp: new Date().toISOString()
        }, 500);
    }
}
/**
 * Request logger middleware
 * Logs all incoming requests with timing information
 */
export async function requestLogger(c, next) {
    const start = Date.now();
    const { method, url } = c.req;
    console.log(`[Request] ${method} ${url} - Started`);
    await next();
    const duration = Date.now() - start;
    const status = c.res.status;
    console.log(`[Request] ${method} ${url} - ${status} (${duration}ms)`);
}

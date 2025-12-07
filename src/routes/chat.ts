/**
 * Chat Route - Enhanced error handling and logging for POST /chat
 * 
 * This route provides robust error handling, comprehensive logging,
 * and proper validation for the chat endpoint.
 */

import type { Mastra } from "@mastra/core";
import type { Context } from "hono";

/**
 * Interface for chat request body
 */
interface ChatRequest {
  message: string;
}

/**
 * Interface for chat response
 */
interface ChatResponse {
  reply: string;
}

/**
 * Interface for error response
 */
interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

/**
 * Create chat handler with enhanced error handling and logging
 * 
 * @param mastra - Mastra instance to access agents
 * @returns Hono handler function
 */
export function createChatHandler(mastra: Mastra) {
  return async (c: Context): Promise<Response> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    try {
      console.log(`[Chat:${requestId}] Request started`);

      // Parse and validate request body
      let body: any;
      try {
        body = await c.req.json();
        console.log(`[Chat:${requestId}] Body parsed:`, {
          hasMessage: !!body?.message,
          messageLength: body?.message?.length || 0
        });
      } catch (parseError: any) {
        console.error(`[Chat:${requestId}] JSON parse error:`, parseError.message);
        return c.json<ErrorResponse>(
          {
            error: "Invalid JSON",
            details: process.env.NODE_ENV !== 'production' ? parseError.message : undefined,
            timestamp: new Date().toISOString()
          },
          400
        );
      }

      // Validate message field
      const { message } = body as Partial<ChatRequest>;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        console.warn(`[Chat:${requestId}] Missing or invalid message field`);
        return c.json<ErrorResponse>(
          {
            error: "No message provided",
            details: "Request body must contain a 'message' field with non-empty string",
            timestamp: new Date().toISOString()
          },
          400
        );
      }

      console.log(`[Chat:${requestId}] Message validated:`, message.substring(0, 100));

      // Get available agents
      const agents = mastra.getAgents();
      const agentNames = Object.keys(agents);
      
      if (agentNames.length === 0) {
        console.error(`[Chat:${requestId}] No agents available in Mastra instance`);
        return c.json<ErrorResponse>(
          {
            error: "No agent found",
            details: "No AI agents are currently available",
            timestamp: new Date().toISOString()
          },
          500
        );
      }

      const agentName = agentNames[0];
      const agent = agents[agentName] as any;
      console.log(`[Chat:${requestId}] Using agent: ${agentName}`);

      // Call agent with proper error handling
      let reply: string;
      try {
        console.log(`[Chat:${requestId}] Calling agent.generate()`);
        
        // Use generate() for Mastra v0.20+ compatibility
        const response = await agent.generate({
          messages: [{ role: "user", content: message }]
        });
        
        reply = response.text || "No response generated";
        
        const duration = Date.now() - startTime;
        console.log(`[Chat:${requestId}] Agent responded successfully (${duration}ms)`, {
          replyLength: reply.length,
          replyPreview: reply.substring(0, 100)
        });
      } catch (agentError: any) {
        const duration = Date.now() - startTime;
        console.error(`[Chat:${requestId}] Agent error (${duration}ms):`, {
          error: agentError.message,
          stack: agentError.stack,
          name: agentError.name
        });
        
        // Return a graceful error response
        reply = "I apologize, but I encountered an error processing your message. Please try again.";
        
        // Log but don't expose internal errors to client
        console.error(`[Chat:${requestId}] Using fallback reply due to agent error`);
      }

      // Return successful response
      const totalDuration = Date.now() - startTime;
      console.log(`[Chat:${requestId}] Request completed successfully (${totalDuration}ms)`);
      
      return c.json<ChatResponse>({ reply });

    } catch (error: any) {
      // Catch-all for any unexpected errors
      const duration = Date.now() - startTime;
      console.error(`[Chat:${requestId}] Unhandled error (${duration}ms):`, {
        error: error.message,
        stack: error.stack,
        name: error.name
      });

      return c.json<ErrorResponse>(
        {
          error: "Internal server error",
          details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
          timestamp: new Date().toISOString()
        },
        500
      );
    }
  };
}

/**
 * Validate chat request body
 * 
 * @param body - Request body to validate
 * @returns Validation result
 */
export function validateChatRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  if (!body.message) {
    return { valid: false, error: 'Message field is required' };
  }

  if (typeof body.message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }

  if (body.message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  return { valid: true };
}

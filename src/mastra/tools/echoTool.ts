import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const echoTool = createTool({
  id: "echo-tool",
  description: "Echoes back the user's message.",
  inputSchema: z.object({
    message: z.string()
  }),
  outputSchema: z.object({
    reply: z.string()
  }),
  execute: async ({ context }) => {
    const { message } = context;
    return { reply: `Echo: ${message}` };
  }
});

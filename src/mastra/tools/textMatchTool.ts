import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const MEMORY_CONTENT = `hello there, how are you doing today?
what's up brother, nice to hear from you
good morning sunshine, hope you slept well
i love you more than words can say
remember that time we stayed up all night talking?
you always know how to make me smile
can't wait to see you again soon
thinking about you right now
you're my favorite person in the world
let's grab coffee sometime this week
missing our late night conversations
you make everything better just by being here
thanks for always being there for me
you're the best thing that ever happened to me
hope your day is as amazing as you are`;

const memoryLines: string[] = MEMORY_CONTENT
  .toLowerCase()
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

export const textMatchTool = createTool({
  id: "text-match-tool",
  description:
    "Searches the memory for a line that contains the input text and returns it. No AI involved - just simple text matching.",

  inputSchema: z.object({
    searchText: z.string().describe("The text to search for in the memory"),
  }),

  outputSchema: z.object({
    matchedLine: z.string().describe("The matched line from memory, or default message if no match"),
    foundMatch: z.boolean().describe("Whether a match was found"),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔍 [textMatchTool] Searching for:", { searchText: context.searchText });
    logger?.info("📚 [textMatchTool] Memory has", { lineCount: memoryLines.length });

    const searchLower = context.searchText.toLowerCase().trim();
    const match = memoryLines.find((line) => line.includes(searchLower));

    if (match) {
      logger?.info("✅ [textMatchTool] Found match:", { match });
      return {
        matchedLine: match,
        foundMatch: true,
      };
    }

    logger?.info("❌ [textMatchTool] No match found, returning default");
    return {
      matchedLine: "got it. what now, brother?",
      foundMatch: false,
    };
  },
});

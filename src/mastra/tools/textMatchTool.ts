import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const MEMORY_FILE_PATH = path.join(process.cwd(), "us-complete.txt");

let memoryLines: string[] = [];

function loadMemory(): string[] {
  try {
    const content = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
    return content
      .toLowerCase()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    console.error("Failed to load memory file:", error);
    return [];
  }
}

memoryLines = loadMemory();

export const textMatchTool = createTool({
  id: "text-match-tool",
  description:
    "Searches the memory file for a line that contains the input text and returns it. No AI involved - just simple text matching.",

  inputSchema: z.object({
    searchText: z.string().describe("The text to search for in the memory file"),
  }),

  outputSchema: z.object({
    matchedLine: z.string().describe("The matched line from memory, or default message if no match"),
    foundMatch: z.boolean().describe("Whether a match was found"),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔍 [textMatchTool] Searching for:", { searchText: context.searchText });

    if (memoryLines.length === 0) {
      memoryLines = loadMemory();
      logger?.info("🔄 [textMatchTool] Reloaded memory file, lines:", memoryLines.length);
    }

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

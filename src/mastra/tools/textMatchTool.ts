import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

let memoryLines: string[] = [];
let memoryLinesLower: string[] = [];

function loadMemory() {
  let currentDir = "";
  try {
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    currentDir = process.cwd();
  }

  const possiblePaths = [
    path.join(process.cwd(), "us-complete.txt"),
    path.join(process.cwd(), "..", "us-complete.txt"),
    path.join(process.cwd(), "..", "..", "us-complete.txt"),
    "/home/runner/workspace/us-complete.txt",
    path.join(currentDir, "..", "..", "..", "us-complete.txt"),
    path.join(currentDir, "..", "..", "..", "..", "us-complete.txt"),
    path.join(process.cwd(), "public", "us-complete.txt"),
  ];

  for (const memoryPath of possiblePaths) {
    try {
      if (fs.existsSync(memoryPath)) {
        const content = fs.readFileSync(memoryPath, "utf-8");
        memoryLines = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 3);
        memoryLinesLower = memoryLines.map((line) => line.toLowerCase());
        console.log(`📚 Loaded ${memoryLines.length} lines from ${memoryPath}`);
        return;
      }
    } catch (error) {
      continue;
    }
  }
  
  console.error("❌ Failed to load us-complete.txt from any path");
  console.log("Tried paths:", possiblePaths);
  memoryLines = [];
  memoryLinesLower = [];
}

loadMemory();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function scoreMatch(queryTokens: string[], lineTokens: string[]): number {
  if (lineTokens.length === 0) return 0;
  let matches = 0;
  for (const qt of queryTokens) {
    for (const lt of lineTokens) {
      if (lt.includes(qt) || qt.includes(lt)) {
        matches++;
        break;
      }
    }
  }
  return matches / Math.max(queryTokens.length, 1);
}

function findBestMatches(query: string, limit: number = 3): { line: string; score: number }[] {
  const queryLower = query.toLowerCase().trim();
  const queryTokens = tokenize(query);
  const results: { line: string; score: number; index: number }[] = [];

  for (let i = 0; i < memoryLinesLower.length; i++) {
    const lineLower = memoryLinesLower[i];
    const line = memoryLines[i];

    if (lineLower.includes(queryLower)) {
      results.push({ line, score: 1.0, index: i });
      continue;
    }

    for (const token of queryTokens) {
      if (token.length > 3 && lineLower.includes(token)) {
        const lineTokens = tokenize(line);
        const score = scoreMatch(queryTokens, lineTokens);
        if (score > 0.3) {
          results.push({ line, score, index: i });
        }
        break;
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  
  const seen = new Set<string>();
  const unique: { line: string; score: number }[] = [];
  for (const r of results) {
    const key = r.line.substring(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ line: r.line, score: r.score });
      if (unique.length >= limit) break;
    }
  }

  return unique;
}

export const textMatchTool = createTool({
  id: "text-match-tool",
  description:
    "Searches the full memory (us-complete.txt) for lines matching the input using token-based scoring. Returns the best matches from 9000+ lines of conversation history.",

  inputSchema: z.object({
    searchText: z.string().describe("The text to search for in the memory"),
  }),

  outputSchema: z.object({
    matchedLine: z.string().describe("The best matched line from memory"),
    foundMatch: z.boolean().describe("Whether a match was found"),
    confidence: z.number().describe("Match confidence score 0-1"),
    alternatives: z.array(z.string()).describe("Other good matches"),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    const searchText = context.searchText;
    
    logger?.info("🔍 [textMatchTool] Searching for:", { searchText });
    logger?.info("📚 [textMatchTool] Memory has", { lineCount: memoryLines.length });

    if (memoryLines.length === 0) {
      loadMemory();
    }

    if (memoryLines.length === 0) {
      logger?.error("❌ [textMatchTool] No memory loaded");
      return {
        matchedLine: "Memory not loaded. Check us-complete.txt file.",
        foundMatch: false,
        confidence: 0,
        alternatives: [],
      };
    }

    const matches = findBestMatches(searchText, 5);

    if (matches.length > 0 && matches[0].score > 0.3) {
      logger?.info("✅ [textMatchTool] Found match:", { 
        match: matches[0].line.substring(0, 100),
        score: matches[0].score 
      });
      
      return {
        matchedLine: matches[0].line,
        foundMatch: true,
        confidence: matches[0].score,
        alternatives: matches.slice(1).map(m => m.line),
      };
    }

    const randomIndex = Math.floor(Math.random() * Math.min(100, memoryLines.length));
    const randomLine = memoryLines[randomIndex] || "got it. what now, brother?";
    
    logger?.info("🎲 [textMatchTool] No strong match, returning contextual response");
    return {
      matchedLine: randomLine,
      foundMatch: false,
      confidence: 0,
      alternatives: [],
    };
  },
});

export function reloadMemory() {
  loadMemory();
  return memoryLines.length;
}

export function getMemoryStats() {
  return {
    lineCount: memoryLines.length,
    loaded: memoryLines.length > 0,
  };
}

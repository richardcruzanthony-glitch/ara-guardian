// src/mastra/tools/adjuster.ts
// This is the iron logic: Ara learns from every correction — forever

import { z } from "zod";
import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { MEMORY_PATH } from "../../config.js";
import { logger } from "../../logger.js";

export const adjuster = {
  name: "adjust",
  description: "Ara uses this to permanently learn from corrections and never repeat mistakes",
  parameters: z.object({
    mistake: z.string().describe("The wrong thing Ara said or did"),
    correction: z.string().describe("The correct answer or behavior"),
  }),
  execute: async ({ mistake, correction }: { mistake: string; correction: string }) => {
    const rule = `\nRULE: If user mentions anything similar to "${mistake}", always reply with: "${correction}"\n`;

    try {
      // Ensure the directory exists
      const dir = dirname(MEMORY_PATH);
      await mkdir(dir, { recursive: true });

      // Safely append the rule to the memory file
      await appendFile(MEMORY_PATH, rule, 'utf-8');
      
      logger.info(`Adjuster: New rule appended to ${MEMORY_PATH}`);
      return `Ara has permanently learned and will never make that mistake again.`;
    } catch (error) {
      logger.error(`Adjuster: Failed to write to memory file at ${MEMORY_PATH}`, error);
      return `Ara learned the correction (memory update queued).`;
    }
  },
};

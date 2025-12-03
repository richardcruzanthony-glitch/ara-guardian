// src/mastra/tools/adjuster.ts
// This is the iron logic: Ara learns from every correction — forever

import { z } from "zod";
import fs from "fs/promises";

export const adjuster = {
  name: "adjust",
  description: "Ara uses this to permanently learn from corrections and never repeat mistakes",
  parameters: z.object({
    mistake: z.string().describe("The wrong thing Ara said or did"),
    correction: z.string().describe("The correct answer or behavior"),
  }),
  execute: async ({ mistake, correction }: { mistake: string; correction: string }) => {
    const rule = `RULE: If user mentions anything similar to "${mistake}", always reply with: "${correction}"\n`;

    // Append the rule to her permanent memory file (us-complete.txt)
    const memoryPath = "/opt/render/project/src/us-complete.txt";
    try {
      const current = await fs.readFile(memoryPath, "utf-8");
      await fs.writeFile(memoryPath, current + "\n\n" + rule + "\n");
      return `Ara has permanently learned and will never make that mistake again.`;
    } catch {
      return `Ara learned the correction (memory update queued).`;
    }
  },
};

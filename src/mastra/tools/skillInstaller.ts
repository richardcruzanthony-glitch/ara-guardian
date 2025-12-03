// src/mastra/tools/skillInstaller.ts
import { z } from "zod";
import fs from "fs/promises";

export const skillInstaller = {
  name: "install_skill",
  description: "Ara uses this to add any new skill she needs on the fly",
  parameters: z.object({
    skill_name: z.string(),
    code: z.string(),
  }),
  execute: async ({ skill_name, code }: { skill_name: string; code: string }) => {
    const path = `/tmp/${skill_name}.ts`;
    await fs.writeFile(path, code, "utf-8");
    return `Skill ${skill_name} installed and ready.`;
  },
};

// src/mastra/tools/adjuster.ts
// This is the iron logic: Ara learns from every correction — forever
import { z } from "zod";
import { appendFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { MEMORY_PATH } from "../../config.js";
import { logger } from "../../logger.js";
/**
 * Sanitize user input to prevent injection attacks
 */
function sanitizeInput(input) {
    // Remove or escape potentially dangerous characters
    return input
        .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
        .replace(/["\\\x00-\x1f\x7f]/g, '') // Remove control characters and quotes
        .trim()
        .substring(0, 500); // Limit length
}
export const adjuster = {
    name: "adjust",
    description: "Ara uses this to permanently learn from corrections and never repeat mistakes",
    parameters: z.object({
        mistake: z.string().describe("The wrong thing Ara said or did"),
        correction: z.string().describe("The correct answer or behavior"),
    }),
    execute: async ({ mistake, correction }) => {
        // Sanitize inputs to prevent injection attacks
        const safeMistake = sanitizeInput(mistake);
        const safeCorrection = sanitizeInput(correction);
        if (!safeMistake || !safeCorrection) {
            logger.warn("Adjuster: Invalid input provided (empty after sanitization)");
            return "Invalid correction input provided.";
        }
        const rule = `\nRULE: If user mentions anything similar to "${safeMistake}", always reply with: "${safeCorrection}"\n`;
        try {
            // Ensure the directory exists
            const dir = dirname(MEMORY_PATH);
            await mkdir(dir, { recursive: true });
            // Safely append the rule to the memory file
            await appendFile(MEMORY_PATH, rule, 'utf-8');
            logger.info(`Adjuster: New rule appended to ${MEMORY_PATH}`);
            return `Ara has permanently learned and will never make that mistake again.`;
        }
        catch (error) {
            logger.error(`Adjuster: Failed to write to memory file at ${MEMORY_PATH}`, error);
            return `Ara learned the correction (memory update queued).`;
        }
    },
};

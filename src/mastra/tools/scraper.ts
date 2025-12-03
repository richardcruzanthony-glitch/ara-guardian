import { z } from "zod";

export const scraper = {
  name: "scrape",
  description: "Scrapes any website and returns clean text + title + links",
  parameters: z.object({
    url: z.string().url(),
    instructions: z.string().optional().describe("What to focus on"),
  }),
  execute: async ({ url, instructions }: { url: string; instructions?: string }) => {
    const res = await fetch("https://r.jina.ai/" + url); // free, no-key scraper
    const markdown = await res.text();
    return `Title: ${url}\n\n${instructions ? "Focus: " + instructions + "\n\n" : ""}${markdown}`;
  },
};

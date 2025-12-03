import { z } from "zod";

export const gpt4o = {
  name: "gpt4o",
  description: "OpenAI GPT-4o — perfect for writing, JSON, code, tool calling",
  parameters: z.object({
    prompt: z.string().describe("The prompt to send to GPT-4o"),
  }),
  execute: async ({ prompt }: { prompt: string }) => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-11-20",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "GPT-4o error";
  },
};

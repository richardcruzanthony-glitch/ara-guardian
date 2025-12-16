import { z } from "zod";

export const grokReasoning = {
  name: "grok_reasoning",
  description: "Full Grok-4 level reasoning + real-time knowledge. Use this for anything hard or up-to-date.",
  parameters: z.object({
    question: z.string().describe("The exact question to send to Grok"),
  }),
  execute: async ({ question }: { question: string }) => {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok",
        messages: [{ role: "human", content: question }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response from Grok";
  },
};

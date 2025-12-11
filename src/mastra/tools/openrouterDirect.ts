
import { OpenRouter } from '@openrouter/sdk';
export const openrouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});


export async function getOpenRouterCompletion(message: string) {
  const completion = await openrouterClient.chat.send({
    model: 'openai/gpt-4o',
    messages: [{ role: 'user', content: message }],
    stream: false,
  });
  return completion.choices[0]?.message?.content || 'No response';
}

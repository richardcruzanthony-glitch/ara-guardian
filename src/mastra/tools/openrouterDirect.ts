
import { OpenRouter } from '@openrouter/sdk';
export const openrouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});


export async function getOpenRouterCompletion(message: any) { // Change type signature to accept any input
  let safeMessage: string;
  if (typeof message === 'string') {
    safeMessage = message;
  } else if (Array.isArray(message)) {
    safeMessage = message.map(m => typeof m === 'string' ? m : JSON.stringify(m)).join(' ');
  } else if (typeof message === 'object' && message !== null && 'content' in message) {
    safeMessage = String(message.content);
  } else {
    safeMessage = JSON.stringify(message);
  }
  const completion = await openrouterClient.chat.send({
    model: 'openai/gpt-4o',
    messages: [{ role: 'user', content: safeMessage }],
    stream: false,
  });
  return completion.choices[0]?.message?.content || 'No response';
}

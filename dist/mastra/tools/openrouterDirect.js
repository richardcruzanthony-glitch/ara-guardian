import { OpenRouter } from '@openrouter/sdk';
export const openrouterClient = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});
export async function getOpenRouterCompletion(message) {
    console.log('Sending to OpenRouter:', message);
    const completion = await openrouterClient.chat.send({
        model: 'mistral/devstral-2-2512', // Use Mistral Devstral 2 2512 free model
        messages: [{ role: 'user', content: message }],
        stream: false,
    });
    console.log('OpenRouter response:', completion);
    return completion.choices[0]?.message?.content || 'No response';
}

---
title: "Using Tools | Tools & MCP | Mastra Docs"
description: Understand what tools are in Mastra, how to add them to agents, and best practices for designing effective tools.
---

import { Steps } from "nextra/components";

# Using Tools
[EN] Source: https://mastra.ai/en/docs/tools-mcp/overview

Tools are functions that agents can execute to perform specific tasks or access external information. They extend an agent's capabilities beyond simple text generation, allowing interaction with APIs, databases, or other systems.

Each tool typically defines:

- **Inputs:** What information the tool needs to run (defined with an `inputSchema`, often using Zod).
- **Outputs:** The structure of the data the tool returns (defined with an `outputSchema`).
- **Execution Logic:** The code that performs the tool's action.
- **Description:** Text that helps the agent understand what the tool does and when to use it.

## Creating Tools

In Mastra, you create tools using the [`createTool`](/reference/tools/create-tool) function from the `@mastra/core/tools` package.

```typescript filename="src/mastra/tools/weatherInfo.ts" copy
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const getWeatherInfo = async (city: string) => {
  // Replace with an actual API call to a weather service
  console.log(`Fetching weather for ${city}...`);
  // Example data structure
  return { temperature: 20, conditions: "Sunny" };
};

export const weatherTool = createTool({
  id: "Get Weather Information",
  description: `Fetches the current weather information for a given city`,
  inputSchema: z.object({
    city: z.string().describe("City name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  execute: async ({ context: { city } }) => {
    console.log("Using tool to fetch weather information for", city);
    return await getWeatherInfo(city);
  },
});
```

This example defines a `weatherTool` with an input schema for the city, an output schema for the weather data, and an `execute` function that contains the tool's logic.

When creating tools, keep tool descriptions simple and focused on **what** the tool does and **when** to use it, emphasizing its primary use case. Technical details belong in the parameter schemas, guiding the agent on _how_ to use the tool correctly with descriptive names, clear descriptions, and explanations of default values.

## Adding Tools to an Agent

To make tools available to an agent, you configure them in the agent's definition. Mentioning available tools and their general purpose in the agent's system prompt can also improve tool usage. For detailed steps and examples, see the guide on [Using Tools and MCP with Agents](/docs/agents/using-tools-and-mcp#add-tools-to-an-agent).

## Using `RuntimeContext`

Use [RuntimeContext](../server-db/runtime-context.mdx) to access request-specific values. This lets you conditionally adjust behavior based on the context of the request.

```typescript filename="src/mastra/tools/test-tool.ts" showLineNumbers
export type UserTier = {
  "user-tier": "enterprise" | "pro";
};

const advancedTools = () => {
  // ...
};

const baseTools =  () => {
  // ...
};

export const testTool = createTool({
  // ...
  execute: async ({ runtimeContext }) => {
    const userTier = runtimeContext.get("user-tier") as UserTier["user-tier"];

    return userTier === "enterprise"
      ? advancedTools
      : baseTools;
  }
});
```

> See [Runtime Context](../server-db/runtime-context.mdx) for more information.

## Testing with Mastra Playground

Use the Mastra [Playground](../server-db/local-dev-playground.mdx) to test tools with different inputs, inspect execution results, and verify tool behavior.



---
title: Voice in Mastra | Mastra Docs
description: Overview of voice capabilities in Mastra, including text-to-speech, speech-to-text, and real-time speech-to-speech interactions.
---

import { Tabs } from "nextra/components";
import { AudioPlayback } from "@/components/audio-playback";

# Voice in Mastra
[EN] Source: https://mastra.ai/en/docs/voice/overview

Mastra's Voice system provides a unified interface for voice interactions, enabling text-to-speech (TTS), speech-to-text (STT), and real-time speech-to-speech (STS) capabilities in your applications.

## Adding Voice to Agents

To learn how to integrate voice capabilities into your agents, check out the [Adding Voice to Agents](../agents/adding-voice.mdx) documentation. This section covers how to use both single and multiple voice providers, as well as real-time interactions.

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { OpenAIVoice } from "@mastra/voice-openai";

// Initialize OpenAI voice for TTS

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions:
    "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new OpenAIVoice(),
});
```

You can then use the following voice capabilities:

### Text to Speech (TTS)

Turn your agent's responses into natural-sounding speech using Mastra's TTS capabilities.
Choose from multiple providers like OpenAI, ElevenLabs, and more.

For detailed configuration options and advanced features, check out our [Text-to-Speech guide](./text-to-speech).

{/*
LLM CONTEXT: This Tabs component demonstrates Text-to-Speech (TTS) implementation across different voice providers.
Each tab shows how to set up and use a specific TTS provider (OpenAI, Azure, ElevenLabs, etc.) with Mastra agents.
The tabs help users compare different TTS providers and choose the one that best fits their needs.
Each tab includes complete code examples showing agent setup, text generation, and audio playback.
The providers include OpenAI, Azure, ElevenLabs, PlayAI, Google, Cloudflare, Deepgram, Speechify, Sarvam, and Murf.
*/}

<Tabs items={["OpenAI", "Azure", "ElevenLabs", "PlayAI", "Google", "Cloudflare", "Deepgram", "Speechify", "Sarvam", "Murf"]}>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { OpenAIVoice } from "@mastra/voice-openai";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new OpenAIVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
speaker: "default", // Optional: specify a speaker
responseFormat: "wav", // Optional: specify a response format
});

playAudio(audioStream);

````

Visit the [OpenAI Voice Reference](/reference/voice/openai) for more information on the OpenAI voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { AzureVoice } from "@mastra/voice-azure";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new AzureVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
  speaker: "en-US-JennyNeural", // Optional: specify a speaker
});

playAudio(audioStream);
````

Visit the [Azure Voice Reference](/reference/voice/azure) for more information on the Azure voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { ElevenLabsVoice } from "@mastra/voice-elevenlabs";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new ElevenLabsVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
speaker: "default", // Optional: specify a speaker
});

playAudio(audioStream);

````

Visit the [ElevenLabs Voice Reference](/reference/voice/elevenlabs) for more information on the ElevenLabs voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { PlayAIVoice } from "@mastra/voice-playai";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new PlayAIVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
  speaker: "default", // Optional: specify a speaker
});

playAudio(audioStream);
````

Visit the [PlayAI Voice Reference](/reference/voice/playai) for more information on the PlayAI voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { GoogleVoice } from "@mastra/voice-google";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new GoogleVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
speaker: "en-US-Studio-O", // Optional: specify a speaker
});

playAudio(audioStream);

````

Visit the [Google Voice Reference](/reference/voice/google) for more information on the Google voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { CloudflareVoice } from "@mastra/voice-cloudflare";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new CloudflareVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
  speaker: "default", // Optional: specify a speaker
});

playAudio(audioStream);
````

Visit the [Cloudflare Voice Reference](/reference/voice/cloudflare) for more information on the Cloudflare voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { DeepgramVoice } from "@mastra/voice-deepgram";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new DeepgramVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
speaker: "aura-english-us", // Optional: specify a speaker
});

playAudio(audioStream);

````

Visit the [Deepgram Voice Reference](/reference/voice/deepgram) for more information on the Deepgram voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { SpeechifyVoice } from "@mastra/voice-speechify";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new SpeechifyVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
  speaker: "matthew", // Optional: specify a speaker
});

playAudio(audioStream);
````

Visit the [Speechify Voice Reference](/reference/voice/speechify) for more information on the Speechify voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { SarvamVoice } from "@mastra/voice-sarvam";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new SarvamVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
speaker: "default", // Optional: specify a speaker
});

playAudio(audioStream);

````

Visit the [Sarvam Voice Reference](/reference/voice/sarvam) for more information on the Sarvam voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { MurfVoice } from "@mastra/voice-murf";
import { playAudio } from "@mastra/node-audio";

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new MurfVoice(),
});

const { text } = await voiceAgent.generate('What color is the sky?');

// Convert text to speech to an Audio Stream
const audioStream = await voiceAgent.voice.speak(text, {
  speaker: "default", // Optional: specify a speaker
});

playAudio(audioStream);
````

Visit the [Murf Voice Reference](/reference/voice/murf) for more information on the Murf voice provider.

  </Tabs.Tab>
</Tabs>

### Speech to Text (STT)

Transcribe spoken content using various providers like OpenAI, ElevenLabs, and more. For detailed configuration options and more, check out [Speech to Text](./speech-to-text).

You can download a sample audio file from [here](https://github.com/mastra-ai/realtime-voice-demo/raw/refs/heads/main/how_can_i_help_you.mp3).

<br />
<AudioPlayback audio="https://github.com/mastra-ai/realtime-voice-demo/raw/refs/heads/main/how_can_i_help_you.mp3" />

{/*
LLM CONTEXT: This Tabs component demonstrates Speech-to-Text (STT) implementation across different voice providers.
Each tab shows how to set up and use a specific STT provider for transcribing audio to text.
The tabs help users understand how to implement speech recognition with different providers.
Each tab includes code examples showing audio file handling, transcription, and response generation.
*/}

<Tabs items={["OpenAI", "Azure", "ElevenLabs", "Google", "Cloudflare", "Deepgram", "Sarvam"]}>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { OpenAIVoice } from "@mastra/voice-openai";
import { createReadStream } from 'fs';

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new OpenAIVoice(),
});

// Use an audio file from a URL
const audioStream = await createReadStream("./how_can_i_help_you.mp3");

// Convert audio to text
const transcript = await voiceAgent.voice.listen(audioStream);
console.log(`User said: ${transcript}`);

// Generate a response based on the transcript
const { text } = await voiceAgent.generate(transcript);

````

Visit the [OpenAI Voice Reference](/reference/voice/openai) for more information on the OpenAI voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { createReadStream } from 'fs';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { AzureVoice } from "@mastra/voice-azure";
import { createReadStream } from 'fs';

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new AzureVoice(),
});

// Use an audio file from a URL
const audioStream = await createReadStream("./how_can_i_help_you.mp3");

// Convert audio to text
const transcript = await voiceAgent.voice.listen(audioStream);
console.log(`User said: ${transcript}`);

// Generate a response based on the transcript
const { text } = await voiceAgent.generate(transcript);
````

Visit the [Azure Voice Reference](/reference/voice/azure) for more information on the Azure voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { ElevenLabsVoice } from "@mastra/voice-elevenlabs";
import { createReadStream } from 'fs';

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new ElevenLabsVoice(),
});

// Use an audio file from a URL
const audioStream = await createReadStream("./how_can_i_help_you.mp3");

// Convert audio to text
const transcript = await voiceAgent.voice.listen(audioStream);
console.log(`User said: ${transcript}`);

// Generate a response based on the transcript
const { text } = await voiceAgent.generate(transcript);

````

Visit the [ElevenLabs Voice Reference](/reference/voice/elevenlabs) for more information on the ElevenLabs voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { GoogleVoice } from "@mastra/voice-google";
import { createReadStream } from 'fs';

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new GoogleVoice(),
});

// Use an audio file from a URL
const audioStream = await createReadStream("./how_can_i_help_you.mp3");

// Convert audio to text
const transcript = await voiceAgent.voice.listen(audioStream);
console.log(`User said: ${transcript}`);

// Generate a response based on the transcript
const { text } = await voiceAgent.generate(transcript);
````

Visit the [Google Voice Reference](/reference/voice/google) for more information on the Google voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { CloudflareVoice } from "@mastra/voice-cloudflare";
import { createReadStream } from 'fs';

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new CloudflareVoice(),
});

// Use an audio file from a URL
const audioStream = await createReadStream("./how_can_i_help_you.mp3");

// Convert audio to text
const transcript = await voiceAgent.voice.listen(audioStream);
console.log(`User said: ${transcript}`);

// Generate a response based on the transcript
const { text } = await voiceAgent.generate(transcript);

````

Visit the [Cloudflare Voice Reference](/reference/voice/cloudflare) for more information on the Cloudflare voice provider.
  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { DeepgramVoice } from "@mastra/voice-deepgram";
import { createReadStream } from 'fs';

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new DeepgramVoice(),
});

// Use an audio file from a URL
const audioStream = await createReadStream("./how_can_i_help_you.mp3");

// Convert audio to text
const transcript = await voiceAgent.voice.listen(audioStream);
console.log(`User said: ${transcript}`);

// Generate a response based on the transcript
const { text } = await voiceAgent.generate(transcript);
````

Visit the [Deepgram Voice Reference](/reference/voice/deepgram) for more information on the Deepgram voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { SarvamVoice } from "@mastra/voice-sarvam";
import { createReadStream } from 'fs';

const voiceAgent = new Agent({
name: "Voice Agent",
instructions: "You are a voice assistant that can help users with their tasks.",
model: openai("gpt-4o"),
voice: new SarvamVoice(),
});

// Use an audio file from a URL
const audioStream = await createReadStream("./how_can_i_help_you.mp3");

// Convert audio to text
const transcript = await voiceAgent.voice.listen(audioStream);
console.log(`User said: ${transcript}`);

// Generate a response based on the transcript
const { text } = await voiceAgent.generate(transcript);

````

Visit the [Sarvam Voice Reference](/reference/voice/sarvam) for more information on the Sarvam voice provider.
  </Tabs.Tab>
</Tabs>

### Speech to Speech (STS)

Create conversational experiences with speech-to-speech capabilities. The unified API enables real-time voice interactions between users and AI agents.
For detailed configuration options and advanced features, check out [Speech to Speech](./speech-to-speech).

{/*
  LLM CONTEXT: This Tabs component demonstrates Speech-to-Speech (STS) implementation for real-time voice interactions.
  Currently only shows OpenAI's realtime voice implementation for bidirectional voice conversations.
  The tab shows how to set up real-time voice communication with event handling for audio responses.
  This enables conversational AI experiences with continuous audio streaming.
*/}
<Tabs items={["OpenAI", "Google Gemini Live"]}>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { playAudio, getMicrophoneStream } from '@mastra/node-audio';
import { OpenAIRealtimeVoice } from "@mastra/voice-openai-realtime";

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new OpenAIRealtimeVoice(),
});

// Listen for agent audio responses
voiceAgent.voice.on('speaker', ({ audio }) => {
  playAudio(audio);
});

// Initiate the conversation
await voiceAgent.voice.speak('How can I help you today?');

// Send continuous audio from the microphone
const micStream = getMicrophoneStream();
await voiceAgent.voice.send(micStream);
````

Visit the [OpenAI Voice Reference](/reference/voice/openai-realtime) for more information on the OpenAI voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { playAudio, getMicrophoneStream } from '@mastra/node-audio';
import { GeminiLiveVoice } from "@mastra/voice-google-gemini-live";

const voiceAgent = new Agent({
  name: "Voice Agent",
  instructions: "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice: new GeminiLiveVoice({
    // Live API mode
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.0-flash-exp',
    speaker: 'Puck',
    debug: true,
    // Vertex AI alternative:
    // vertexAI: true,
    // project: 'your-gcp-project',
    // location: 'us-central1',
    // serviceAccountKeyFile: '/path/to/service-account.json',
  }),
});

// Connect before using speak/send
await voiceAgent.voice.connect();

// Listen for agent audio responses
voiceAgent.voice.on('speaker', ({ audio }) => {
  playAudio(audio);
});

// Listen for text responses and transcriptions
voiceAgent.voice.on('writing', ({ text, role }) => {
  console.log(`${role}: ${text}`);
});

// Initiate the conversation
await voiceAgent.voice.speak('How can I help you today?');

// Send continuous audio from the microphone
const micStream = getMicrophoneStream();
await voiceAgent.voice.send(micStream);
```

Visit the [Google Gemini Live Reference](/reference/voice/google-gemini-live) for more information on the Google Gemini Live voice provider.

  </Tabs.Tab>
</Tabs>

## Voice Configuration

Each voice provider can be configured with different models and options. Below are the detailed configuration options for all supported providers:

{/*
LLM CONTEXT: This Tabs component shows detailed configuration options for all supported voice providers.
Each tab demonstrates how to configure a specific voice provider with all available options and settings.
The tabs help users understand the full configuration capabilities of each provider including models, languages, and advanced settings.
Each tab shows both speech and listening model configurations where applicable.
*/}

<Tabs items={["OpenAI", "Azure", "ElevenLabs", "PlayAI", "Google", "Cloudflare", "Deepgram", "Speechify", "Sarvam", "Murf", "OpenAI Realtime", "Google Gemini Live"]}>
  <Tabs.Tab>
```typescript
// OpenAI Voice Configuration
const voice = new OpenAIVoice({
  speechModel: {
    name: "gpt-3.5-turbo", // Example model name
    apiKey: process.env.OPENAI_API_KEY,
    language: "en-US", // Language code
    voiceType: "neural", // Type of voice model
  },
  listeningModel: {
    name: "whisper-1", // Example model name
    apiKey: process.env.OPENAI_API_KEY,
    language: "en-US", // Language code
    format: "wav", // Audio format
  },
  speaker: "alloy", // Example speaker name
});
```

Visit the [OpenAI Voice Reference](/reference/voice/openai) for more information on the OpenAI voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Azure Voice Configuration
const voice = new AzureVoice({
  speechModel: {
    name: "en-US-JennyNeural", // Example model name
    apiKey: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION,
    language: "en-US", // Language code
    style: "cheerful", // Voice style
    pitch: "+0Hz", // Pitch adjustment
    rate: "1.0", // Speech rate
  },
  listeningModel: {
    name: "en-US", // Example model name
    apiKey: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION,
    format: "simple", // Output format
  },
});
```

Visit the [Azure Voice Reference](/reference/voice/azure) for more information on the Azure voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// ElevenLabs Voice Configuration
const voice = new ElevenLabsVoice({
  speechModel: {
    voiceId: "your-voice-id", // Example voice ID
    model: "eleven_multilingual_v2", // Example model name
    apiKey: process.env.ELEVENLABS_API_KEY,
    language: "en", // Language code
    emotion: "neutral", // Emotion setting
  },
  // ElevenLabs may not have a separate listening model
});
```

Visit the [ElevenLabs Voice Reference](/reference/voice/elevenlabs) for more information on the ElevenLabs voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// PlayAI Voice Configuration
const voice = new PlayAIVoice({
  speechModel: {
    name: "playai-voice", // Example model name
    speaker: "emma", // Example speaker name
    apiKey: process.env.PLAYAI_API_KEY,
    language: "en-US", // Language code
    speed: 1.0, // Speech speed
  },
  // PlayAI may not have a separate listening model
});
```

Visit the [PlayAI Voice Reference](/reference/voice/playai) for more information on the PlayAI voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Google Voice Configuration
const voice = new GoogleVoice({
  speechModel: {
    name: "en-US-Studio-O", // Example model name
    apiKey: process.env.GOOGLE_API_KEY,
    languageCode: "en-US", // Language code
    gender: "FEMALE", // Voice gender
    speakingRate: 1.0, // Speaking rate
  },
  listeningModel: {
    name: "en-US", // Example model name
    sampleRateHertz: 16000, // Sample rate
  },
});
```

Visit the [Google Voice Reference](/reference/voice/google) for more information on the Google voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Cloudflare Voice Configuration
const voice = new CloudflareVoice({
  speechModel: {
    name: "cloudflare-voice", // Example model name
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    language: "en-US", // Language code
    format: "mp3", // Audio format
  },
  // Cloudflare may not have a separate listening model
});
```

Visit the [Cloudflare Voice Reference](/reference/voice/cloudflare) for more information on the Cloudflare voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Deepgram Voice Configuration
const voice = new DeepgramVoice({
  speechModel: {
    name: "nova-2", // Example model name
    speaker: "aura-english-us", // Example speaker name
    apiKey: process.env.DEEPGRAM_API_KEY,
    language: "en-US", // Language code
    tone: "formal", // Tone setting
  },
  listeningModel: {
    name: "nova-2", // Example model name
    format: "flac", // Audio format
  },
});
```

Visit the [Deepgram Voice Reference](/reference/voice/deepgram) for more information on the Deepgram voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Speechify Voice Configuration
const voice = new SpeechifyVoice({
  speechModel: {
    name: "speechify-voice", // Example model name
    speaker: "matthew", // Example speaker name
    apiKey: process.env.SPEECHIFY_API_KEY,
    language: "en-US", // Language code
    speed: 1.0, // Speech speed
  },
  // Speechify may not have a separate listening model
});
```

Visit the [Speechify Voice Reference](/reference/voice/speechify) for more information on the Speechify voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Sarvam Voice Configuration
const voice = new SarvamVoice({
  speechModel: {
    name: "sarvam-voice", // Example model name
    apiKey: process.env.SARVAM_API_KEY,
    language: "en-IN", // Language code
    style: "conversational", // Style setting
  },
  // Sarvam may not have a separate listening model
});
```

Visit the [Sarvam Voice Reference](/reference/voice/sarvam) for more information on the Sarvam voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Murf Voice Configuration
const voice = new MurfVoice({
  speechModel: {
    name: "murf-voice", // Example model name
    apiKey: process.env.MURF_API_KEY,
    language: "en-US", // Language code
    emotion: "happy", // Emotion setting
  },
  // Murf may not have a separate listening model
});
```

Visit the [Murf Voice Reference](/reference/voice/murf) for more information on the Murf voice provider.

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// OpenAI Realtime Voice Configuration
const voice = new OpenAIRealtimeVoice({
  speechModel: {
    name: "gpt-3.5-turbo", // Example model name
    apiKey: process.env.OPENAI_API_KEY,
    language: "en-US", // Language code
  },
  listeningModel: {
    name: "whisper-1", // Example model name
    apiKey: process.env.OPENAI_API_KEY,
    format: "ogg", // Audio format
  },
  speaker: "alloy", // Example speaker name
});
```

For more information on the OpenAI Realtime voice provider, refer to the [OpenAI Realtime Voice Reference](/reference/voice/openai-realtime).

  </Tabs.Tab>
  <Tabs.Tab>
```typescript
// Google Gemini Live Voice Configuration
const voice = new GeminiLiveVoice({
  speechModel: {
    name: "gemini-2.0-flash-exp", // Example model name
    apiKey: process.env.GOOGLE_API_KEY,
  },
  speaker: "Puck", // Example speaker name
  // Google Gemini Live is a realtime bidirectional API without separate speech and listening models
});
```

Visit the [Google Gemini Live Reference](/reference/voice/google-gemini-live) for more information on the Google Gemini Live voice provider.

  </Tabs.Tab>
</Tabs>

### Using Multiple Voice Providers

This example demonstrates how to create and use two different voice providers in Mastra: OpenAI for speech-to-text (STT) and PlayAI for text-to-speech (TTS).

Start by creating instances of the voice providers with any necessary configuration.

```typescript
import { OpenAIVoice } from "@mastra/voice-openai";
import { PlayAIVoice } from "@mastra/voice-playai";
import { CompositeVoice } from "@mastra/core/voice";
import { playAudio, getMicrophoneStream } from "@mastra/node-audio";

// Initialize OpenAI voice for STT
const input = new OpenAIVoice({
  listeningModel: {
    name: "whisper-1",
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Initialize PlayAI voice for TTS
const output = new PlayAIVoice({
  speechModel: {
    name: "playai-voice",
    apiKey: process.env.PLAYAI_API_KEY,
  },
});

// Combine the providers using CompositeVoice
const voice = new CompositeVoice({
  input,
  output,
});

// Implement voice interactions using the combined voice provider
const audioStream = getMicrophoneStream(); // Assume this function gets audio input
const transcript = await voice.listen(audioStream);

// Log the transcribed text
console.log("Transcribed text:", transcript);

// Convert text to speech
const responseAudio = await voice.speak(`You said: ${transcript}`, {
  speaker: "default", // Optional: specify a speaker,
  responseFormat: "wav", // Optional: specify a response format
});

// Play the audio response
playAudio(responseAudio);
```

For more information on the CompositeVoice, refer to the [CompositeVoice Reference](/reference/voice/composite-voice).

## More Resources

- [CompositeVoice](../../reference/voice/composite-voice.mdx)
- [MastraVoice](../../reference/voice/mastra-voice.mdx)
- [OpenAI Voice](../../reference/voice/openai.mdx)
- [OpenAI Realtime Voice](../../reference/voice/openai-realtime.mdx)
- [Azure Voice](../../reference/voice/azure.mdx)
- [Google Voice](../../reference/voice/google.mdx)
- [Google Gemini Live Voice](../../reference/voice/google-gemini-live.mdx)
- [Deepgram Voice](../../reference/voice/deepgram.mdx)
- [PlayAI Voice](../../reference/voice/playai.mdx)
- [Voice Examples](../../examples/voice/text-to-speech.mdx)


---
title: Speech-to-Speech Capabilities in Mastra | Mastra Docs
description: Overview of speech-to-speech capabilities in Mastra, including real-time interactions and event-driven architecture.
---

# Speech-to-Speech Capabilities in Mastra
[EN] Source: https://mastra.ai/en/docs/voice/speech-to-speech

## Introduction

Speech-to-Speech (STS) in Mastra provides a standardized interface for real-time interactions across multiple providers.  
STS enables continuous bidirectional audio communication through listening to events from Realtime models. Unlike separate TTS and STT operations, STS maintains an open connection that processes speech continuously in both directions.

## Configuration

- **`apiKey`**: Your OpenAI API key. Falls back to the `OPENAI_API_KEY` environment variable.
- **`model`**: The model ID to use for real-time voice interactions (e.g., `gpt-4o-mini-realtime`).
- **`speaker`**: The default voice ID for speech synthesis. This allows you to specify which voice to use for the speech output.

```typescript
const voice = new OpenAIRealtimeVoice({
  apiKey: "your-openai-api-key",
  model: "gpt-4o-mini-realtime",
  speaker: "alloy", // Default voice
});

// If using default settings the configuration can be simplified to:
const voice = new OpenAIRealtimeVoice();
```

## Using STS

```typescript
import { Agent } from "@mastra/core/agent";
import { OpenAIRealtimeVoice } from "@mastra/voice-openai-realtime";
import { playAudio, getMicrophoneStream } from "@mastra/node-audio";

const agent = new Agent({
  name: "Agent",
  instructions: `You are a helpful assistant with real-time voice capabilities.`,
  model: openai("gpt-4o"),
  voice: new OpenAIRealtimeVoice(),
});

// Connect to the voice service
await agent.voice.connect();

// Listen for agent audio responses
agent.voice.on("speaker", ({ audio }) => {
  playAudio(audio);
});

// Initiate the conversation
await agent.voice.speak("How can I help you today?");

// Send continuous audio from the microphone
const micStream = getMicrophoneStream();
await agent.voice.send(micStream);
```

For integrating Speech-to-Speech capabilities with agents, refer to the [Adding Voice to Agents](../agents/adding-voice.mdx) documentation.

## Google Gemini Live (Realtime)

```typescript
import { Agent } from "@mastra/core/agent";
import { GeminiLiveVoice } from "@mastra/voice-google-gemini-live";
import { playAudio, getMicrophoneStream } from "@mastra/node-audio";

const agent = new Agent({
  name: 'Agent',
  instructions: 'You are a helpful assistant with real-time voice capabilities.',
  // Model used for text generation; voice provider handles realtime audio
  model: openai("gpt-4o"),
  voice: new GeminiLiveVoice({
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.0-flash-exp',
    speaker: 'Puck',
    debug: true,
    // Vertex AI option:
    // vertexAI: true, 
    // project: 'your-gcp-project', 
    // location: 'us-central1',
    // serviceAccountKeyFile: '/path/to/service-account.json',
  }),
});

await agent.voice.connect();

agent.voice.on('speaker', ({ audio }) => {
  playAudio(audio);
});

agent.voice.on('writing', ({ role, text }) => {
  console.log(`${role}: ${text}`);
});

await agent.voice.speak('How can I help you today?');

const micStream = getMicrophoneStream();
await agent.voice.send(micStream);
```

Note:
- Live API requires `GOOGLE_API_KEY`. Vertex AI requires project/location and service account credentials.
- Events: `speaker` (audio stream), `writing` (text), `turnComplete`, `usage`, and `error`.


---
title: Speech-to-Text (STT) in Mastra | Mastra Docs
description: Overview of Speech-to-Text capabilities in Mastra, including configuration, usage, and integration with voice providers.
---

# Speech-to-Text (STT)
[EN] Source: https://mastra.ai/en/docs/voice/speech-to-text

Speech-to-Text (STT) in Mastra provides a standardized interface for converting audio input into text across multiple service providers.
STT helps create voice-enabled applications that can respond to human speech, enabling hands-free interaction, accessibility for users with disabilities, and more natural human-computer interfaces.

## Configuration

To use STT in Mastra, you need to provide a `listeningModel` when initializing the voice provider. This includes parameters such as:

- **`name`**: The specific STT model to use.
- **`apiKey`**: Your API key for authentication.
- **Provider-specific options**: Additional options that may be required or supported by the specific voice provider.

**Note**: All of these parameters are optional. You can use the default settings provided by the voice provider, which will depend on the specific provider you are using.

```typescript
const voice = new OpenAIVoice({
  listeningModel: {
    name: "whisper-1",
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// If using default settings the configuration can be simplified to:
const voice = new OpenAIVoice();
```

## Available Providers

Mastra supports several Speech-to-Text providers, each with their own capabilities and strengths:

- [**OpenAI**](/reference/voice/openai/) - High-accuracy transcription with Whisper models
- [**Azure**](/reference/voice/azure/) - Microsoft's speech recognition with enterprise-grade reliability
- [**ElevenLabs**](/reference/voice/elevenlabs/) - Advanced speech recognition with support for multiple languages
- [**Google**](/reference/voice/google/) - Google's speech recognition with extensive language support
- [**Cloudflare**](/reference/voice/cloudflare/) - Edge-optimized speech recognition for low-latency applications
- [**Deepgram**](/reference/voice/deepgram/) - AI-powered speech recognition with high accuracy for various accents
- [**Sarvam**](/reference/voice/sarvam/) - Specialized in Indic languages and accents

Each provider is implemented as a separate package that you can install as needed:

```bash
pnpm add @mastra/voice-openai  # Example for OpenAI
```

## Using the Listen Method

The primary method for STT is the `listen()` method, which converts spoken audio into text. Here's how to use it:

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { OpenAIVoice } from "@mastra/voice-openai";
import { getMicrophoneStream } from "@mastra/node-audio";

const voice = new OpenAIVoice();

const agent = new Agent({
  name: "Voice Agent",
  instructions:
    "You are a voice assistant that provides recommendations based on user input.",
  model: openai("gpt-4o"),
  voice,
});

const audioStream = getMicrophoneStream(); // Assume this function gets audio input

const transcript = await agent.voice.listen(audioStream, {
  filetype: "m4a", // Optional: specify the audio file type
});

console.log(`User said: ${transcript}`);

const { text } = await agent.generate(
  `Based on what the user said, provide them a recommendation: ${transcript}`,
);

console.log(`Recommendation: ${text}`);
```

Check out the [Adding Voice to Agents](../agents/adding-voice.mdx) documentation to learn how to use STT in an agent.


---
title: Text-to-Speech (TTS) in Mastra | Mastra Docs
description: Overview of Text-to-Speech capabilities in Mastra, including configuration, usage, and integration with voice providers.
---

# Text-to-Speech (TTS)
[EN] Source: https://mastra.ai/en/docs/voice/text-to-speech

Text-to-Speech (TTS) in Mastra offers a unified API for synthesizing spoken audio from text using various providers.
By incorporating TTS into your applications, you can enhance user experience with natural voice interactions, improve accessibility for users with visual impairments, and create more engaging multimodal interfaces.

TTS is a core component of any voice application. Combined with STT (Speech-to-Text), it forms the foundation of voice interaction systems. Newer models support STS ([Speech-to-Speech](./speech-to-speech)) which can be used for real-time interactions but come at high cost ($).

## Configuration

To use TTS in Mastra, you need to provide a `speechModel` when initializing the voice provider. This includes parameters such as:

- **`name`**: The specific TTS model to use.
- **`apiKey`**: Your API key for authentication.
- **Provider-specific options**: Additional options that may be required or supported by the specific voice provider.

The **`speaker`** option allows you to select different voices for speech synthesis. Each provider offers a variety of voice options with distinct characteristics for **Voice diversity**, **Quality**, **Voice personality**, and **Multilingual support**

**Note**: All of these parameters are optional. You can use the default settings provided by the voice provider, which will depend on the specific provider you are using.

```typescript
const voice = new OpenAIVoice({
  speechModel: {
    name: "tts-1-hd",
    apiKey: process.env.OPENAI_API_KEY,
  },
  speaker: "alloy",
});

// If using default settings the configuration can be simplified to:
const voice = new OpenAIVoice();
```

## Available Providers

Mastra supports a wide range of Text-to-Speech providers, each with their own unique capabilities and voice options. You can choose the provider that best suits your application's needs:

- [**OpenAI**](/reference/voice/openai/) - High-quality voices with natural intonation and expression
- [**Azure**](/reference/voice/azure/) - Microsoft's speech service with a wide range of voices and languages
- [**ElevenLabs**](/reference/voice/elevenlabs/) - Ultra-realistic voices with emotion and fine-grained control
- [**PlayAI**](/reference/voice/playai/) - Specialized in natural-sounding voices with various styles
- [**Google**](/reference/voice/google/) - Google's speech synthesis with multilingual support
- [**Cloudflare**](/reference/voice/cloudflare/) - Edge-optimized speech synthesis for low-latency applications
- [**Deepgram**](/reference/voice/deepgram/) - AI-powered speech technology with high accuracy
- [**Speechify**](/reference/voice/speechify/) - Text-to-speech optimized for readability and accessibility
- [**Sarvam**](/reference/voice/sarvam/) - Specialized in Indic languages and accents
- [**Murf**](/reference/voice/murf/) - Studio-quality voice overs with customizable parameters

Each provider is implemented as a separate package that you can install as needed:

```bash
pnpm add @mastra/voice-openai  # Example for OpenAI
```

## Using the Speak Method

The primary method for TTS is the `speak()` method, which converts text to speech. This method can accept options that allows you to specify the speaker and other provider-specific options. Here's how to use it:

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { OpenAIVoice } from "@mastra/voice-openai";

const voice = new OpenAIVoice();

const agent = new Agent({
  name: "Voice Agent",
  instructions:
    "You are a voice assistant that can help users with their tasks.",
  model: openai("gpt-4o"),
  voice,
});

const { text } = await agent.generate("What color is the sky?");

// Convert text to speech to an Audio Stream
const readableStream = await voice.speak(text, {
  speaker: "default", // Optional: specify a speaker
  properties: {
    speed: 1.0, // Optional: adjust speech speed
    pitch: "default", // Optional: specify pitch if supported
  },
});
```

Check out the [Adding Voice to Agents](../agents/adding-voice.mdx) documentation to learn how to use TTS in an agent.



import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { env } from '@/lib/env';

const geminiApiKey = env().GEMINI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({
    apiKey: geminiApiKey,
  })],
  model: 'googleai/gemini-2.5-flash',
});

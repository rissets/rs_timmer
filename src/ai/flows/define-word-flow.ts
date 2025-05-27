
'use server';
/**
 * @fileOverview A flow to define a word in a specified language using AI.
 *
 * - defineWord - A function that handles the word definition process.
 * - DefineWordInput - The input type for the defineWord function.
 * - DefineWordOutput - The return type for the defineWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DefineWordInputSchema = z.object({
  word: z.string().describe('The word to be defined.'),
  targetLanguage: z.enum(['English', 'Indonesian']).describe('The language in which to define the word.'),
});
export type DefineWordInput = z.infer<typeof DefineWordInputSchema>;

const DefineWordOutputSchema = z.object({
  definition: z.string().describe('A concise definition of the word in the target language.'),
});
export type DefineWordOutput = z.infer<typeof DefineWordOutputSchema>;

export async function defineWord(input: DefineWordInput): Promise<DefineWordOutput> {
  return defineWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'defineWordPrompt',
  input: {schema: DefineWordInputSchema},
  output: {schema: DefineWordOutputSchema},
  prompt: `You are a helpful dictionary assistant.
Provide a concise definition for the word "{{word}}" in {{targetLanguage}}.
The definition should be clear and easy to understand. Aim for 1-2 sentences.
Word: {{{word}}}
Language for Definition: {{targetLanguage}}
`,
});

const defineWordFlow = ai.defineFlow(
  {
    name: 'defineWordFlow',
    inputSchema: DefineWordInputSchema,
    outputSchema: DefineWordOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        // This case handles if the AI successfully responds but output is unexpectedly null/undefined
        throw new Error("The AI returned an empty definition. Please try again.");
      }
      return output;
    } catch (e: any) {
      console.error("Error in defineWordFlow during prompt execution:", e);
      if (e.message && (e.message.includes('SERVICE_DISABLED') || e.message.includes('API has not been used') || e.message.includes('forbidden'))) {
        throw new Error(
          'The AI service for definitions is currently unavailable or not enabled for your project. Please check your Google Cloud project settings or try again later.'
        );
      }
      // Re-throw a more generic error or the original one if it's already informative
      throw new Error(e.message || "Could not get definition from AI. Please try again.");
    }
  }
);


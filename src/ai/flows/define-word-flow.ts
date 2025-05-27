
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
    const {output} = await prompt(input);
    if (!output) {
        // Fallback or error handling if output is null/undefined
        return { definition: "Sorry, I couldn't define that word." };
    }
    return output;
  }
);

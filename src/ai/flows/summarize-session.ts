// src/ai/flows/summarize-session.ts
'use server';

/**
 * @fileOverview Summarizes a pomodoro session and provides feedback.
 *
 * - summarizeSession - A function that summarizes the session and provides feedback.
 * - SummarizeSessionInput - The input type for the summarizeSession function.
 * - SummarizeSessionOutput - The return type for the summarizeSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSessionInputSchema = z.object({
  sessionDetails: z.string().describe('Details of the pomodoro session, including work intervals, break intervals, and any notes taken during the session.'),
});
export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  summary: z.string().describe('A summary of the pomodoro session, including overall focus and productivity.'),
  improvements: z.string().describe('Suggested improvements and strategies for future work intervals to maximize focus.'),
});
export type SummarizeSessionOutput = z.infer<typeof SummarizeSessionOutputSchema>;

export async function summarizeSession(input: SummarizeSessionInput): Promise<SummarizeSessionOutput> {
  return summarizeSessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSessionPrompt',
  input: {schema: SummarizeSessionInputSchema},
  output: {schema: SummarizeSessionOutputSchema},
  prompt: `You are an AI assistant designed to analyze pomodoro sessions and provide personalized feedback.

  Analyze the following session details and provide a summary of the session, including overall focus and productivity.
  Then, suggest improvements and strategies for future work intervals to maximize focus. Focus on actionable advice.

  Session Details: {{{sessionDetails}}}
  `,
});

const summarizeSessionFlow = ai.defineFlow(
  {
    name: 'summarizeSessionFlow',
    inputSchema: SummarizeSessionInputSchema,
    outputSchema: SummarizeSessionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

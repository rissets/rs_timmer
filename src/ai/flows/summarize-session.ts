
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
  sessionDetails: z.string().describe('Details of the pomodoro session, including work intervals, break intervals, a list of tasks (with completion status), and any notes taken during the session.'),
});
export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  summary: z.string().describe('A summary of the pomodoro session, including overall focus, productivity, and reflection on completed/uncompleted tasks.'),
  improvements: z.string().describe('Suggested improvements and strategies for future work intervals to maximize focus, considering tasks and notes.'),
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

  Analyze the following session details. This includes a log of work/break intervals, a list of tasks undertaken (with their completion status), and any session notes.
  Provide a summary of the session, including overall focus and productivity. Reflect on the tasks listed, noting what was accomplished and what remains.
  Then, suggest improvements and strategies for future work intervals to maximize focus. Focus on actionable advice related to the tasks and notes provided.

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

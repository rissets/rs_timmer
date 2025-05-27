
// src/ai/flows/summarize-session.ts
'use server';

/**
 * @fileOverview Summarizes a pomodoro session, tasks, and notes, providing feedback and actionable insights.
 *
 * - summarizeSession - A function that summarizes the session/data and provides feedback.
 * - SummarizeSessionInput - The input type for the summarizeSession function.
 * - SummarizeSessionOutput - The return type for the summarizeSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSessionInputSchema = z.object({
  sessionDetails: z.string().describe('Details of the pomodoro session, which can include work/break intervals, a list of tasks (with completion status), and any notes taken.'),
});
export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  summary: z.string().describe('A concise summary. If a session log exists, this focuses on overall focus, productivity, and reflection on completed/uncompleted tasks in relation to the session. If only tasks and/or notes are provided, it summarizes the key themes or objectives apparent from them.'),
  improvements: z.string().describe('Actionable improvements, next steps, or strategies. Based on all available information (session log, tasks, notes), this suggests concrete actions. If tasks are listed, it comments on their status and suggests how to approach remaining tasks. If notes are provided, it tries to extract key insights or questions that might lead to action.'),
});
export type SummarizeSessionOutput = z.infer<typeof SummarizeSessionOutputSchema>;

export async function summarizeSession(input: SummarizeSessionInput): Promise<SummarizeSessionOutput> {
  return summarizeSessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSessionPrompt',
  input: {schema: SummarizeSessionInputSchema},
  output: {schema: SummarizeSessionOutputSchema},
  prompt: `You are an AI assistant designed to analyze pomodoro sessions, tasks, and notes to provide personalized feedback and action plans.

Analyze the provided details. This may include:
1. A log of work/break intervals from a Pomodoro session (e.g., "Work: 25 min (completed)").
2. A list of tasks undertaken, with their completion status (e.g., "- [x] Design homepage", "- [ ] Write tests").
3. Session notes or general thoughts.

Your goal is to provide:
- A concise summary: If a session log with meaningful activity (e.g., non-zero duration) exists, focus on overall focus, productivity, and reflection on completed/uncompleted tasks in relation to that session. If the session log is minimal or primarily tasks and/or notes are provided, summarize the key themes, progress, or objectives apparent from the tasks and notes.
- Actionable improvements or next steps: Based on all available information (session log, tasks, notes), suggest concrete improvements, strategies for future work, or potential next actions. If tasks are listed, comment on their status (completed, pending) and suggest how to approach remaining tasks. If notes are provided, try to extract key insights, questions, or to-dos that might lead to action.

Prioritize actionable advice. If the input is very brief, acknowledge that and provide general productivity tips if specific advice isn't possible.

Session Details (this will contain a mix of session log, tasks, and notes as available):
{{{sessionDetails}}}
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


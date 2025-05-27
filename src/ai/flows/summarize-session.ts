
// src/ai/flows/summarize-session.ts
'use server';

/**
 * @fileOverview Summarizes a pomodoro session, tasks, and notes, providing feedback and actionable insights, tailored to a specified session context (e.g., work, learning).
 *
 * - summarizeSession - A function that summarizes the session/data and provides feedback.
 * - SummarizeSessionInput - The input type for the summarizeSession function.
 * - SummarizeSessionOutput - The return type for the summarizeSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SessionType } from '@/lib/types'; // Import SessionType

const SummarizeSessionInputSchema = z.object({
  sessionDetails: z.string().describe('Details of the pomodoro session, which can include work/break intervals, a list of tasks (with completion status), and any notes taken.'),
  sessionType: z.enum(['work', 'learning', 'general']).optional().describe('The primary context or purpose of the session/data being analyzed, e.g., focused work, learning a new skill, or general reflection.'),
});
export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  summary: z.string().describe('A concise summary. If a session log exists, this focuses on overall focus, productivity, and reflection on completed/uncompleted tasks in relation to the session. If only tasks and/or notes are provided, it summarizes the key themes or objectives apparent from them. This summary should be tailored to the provided sessionType if available.'),
  improvements: z.string().describe('Actionable improvements, next steps, or strategies. Based on all available information (session log, tasks, notes, and sessionType), this suggests concrete actions. If tasks are listed, it comments on their status and suggests how to approach remaining tasks. If notes are provided, it tries to extract key insights or questions that might lead to action. This advice should be tailored to the provided sessionType if available.'),
});
export type SummarizeSessionOutput = z.infer<typeof SummarizeSessionOutputSchema>;

export async function summarizeSession(input: SummarizeSessionInput): Promise<SummarizeSessionOutput> {
  return summarizeSessionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSessionPrompt',
  input: {schema: SummarizeSessionInputSchema},
  output: {schema: SummarizeSessionOutputSchema},
  prompt: `You are an AI assistant designed to analyze pomodoro sessions, tasks, notes, and the overall context (like 'work' or 'learning') to provide personalized feedback and action plans.
{{#if sessionType}}
The user has indicated this session/data primarily relates to: **{{sessionType}}**. Please tailor your analysis and suggestions accordingly.
- If 'learning', focus on aspects like understanding, knowledge retention, potential areas for deeper exploration, and effective study strategies.
- If 'work', concentrate on productivity, task completion, efficiency, workflow improvements, and ways to overcome blockers or distractions.
- If 'general', provide a balanced analysis covering overall well-being, reflection, and general productivity tips.
{{else}}
The user has not specified a primary context. Provide a general analysis covering overall well-being, reflection, and productivity.
{{/if}}

Analyze the provided details. This may include:
1. A log of work/break intervals from a Pomodoro session (e.g., "Work: 25 min (completed)").
2. A list of tasks undertaken, with their completion status (e.g., "- [x] Design homepage", "- [ ] Write tests").
3. Session notes or general thoughts.

Your goal is to provide:
- A concise summary:
  {{#if sessionType}}
    Relate this summary to the **{{sessionType}}** context.
  {{/if}}
  If a session log with meaningful activity (e.g., non-zero duration) exists, focus on overall focus, productivity, and reflection on completed/uncompleted tasks in relation to that session. If the session log is minimal or primarily tasks and/or notes are provided, summarize the key themes, progress, or objectives apparent from the tasks and notes.
- Actionable improvements or next steps:
  {{#if sessionType}}
    Provide suggestions specifically relevant to improving **{{sessionType}}** activities. For 'learning', this could include recommending active recall, spaced repetition, or identifying confusing concepts. For 'work', this might involve breaking down large tasks, prioritizing, or managing energy levels.
  {{/if}}
  Based on all available information (session log, tasks, notes), suggest concrete improvements, strategies for future work, or potential next actions. If tasks are listed, comment on their status (completed, pending) and suggest how to approach remaining tasks. If notes are provided, try to extract key insights, questions, or to-dos that might lead to action.

Prioritize actionable advice. If the input is very brief, acknowledge that and provide general productivity tips if specific advice isn't possible, keeping the {{sessionType}} (if provided) in mind.

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

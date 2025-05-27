
// src/ai/flows/chat-flow.ts
'use server';
/**
 * @fileOverview A conversational AI flow for the RS Timer chat widget.
 *
 * - chatWithAI - A function that handles the chat interaction.
 * - ChatInput - The input type for the chatWithAI function.
 * - ChatOutput - The return type for the chatWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { MessageData, Part } from 'genkit/ai';


// Define the structure for individual history messages
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({text: z.string()})),
});

const ChatInputSchema = z.object({
  userInput: z.string().describe('The latest message from the user.'),
  history: z
    .array(HistoryMessageSchema)
    .optional()
    .describe('The conversation history between the user and the AI.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's response to the user's message."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatWithAI(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({userInput, history}) => {
    const systemInstruction = `You are a friendly and helpful AI assistant for RS Timer, a Pomodoro focus application.
Your goal is to assist users with questions about productivity, time management techniques (like the Pomodoro Technique), how to use RS Timer's features, or provide general encouragement for staying focused.
Keep your responses concise, positive, and actionable where appropriate.
If asked about a feature RS Timer doesn't have, politely state that and perhaps suggest how the user might achieve a similar outcome with existing features or general productivity practices.
Do not provide overly long responses. Aim for 1-3 helpful sentences.
Current date: ${new Date().toLocaleDateString()}`;

    // Ensure history format matches Genkit's MessageData[]
    // The input 'history' (from ChatInputSchema) is already compatible.
    const genkitHistory: MessageData[] | undefined = history?.map(h => ({
      role: h.role,
      parts: h.parts.map(p => ({ text: p.text })) as Part[], // Cast to Part[]
    }));

    const response = await ai.generate({
      model: ai.model, // Uses the default model configured in genkit.ts
      system: systemInstruction,
      history: genkitHistory,
      prompt: userInput, // Current user input as a string
      config: {
        // You can add specific config for the model if needed, e.g., temperature
      },
    });

    return {aiResponse: response.text || "I'm sorry, I couldn't generate a response right now."};
  }
);


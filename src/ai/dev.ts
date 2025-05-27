
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-session.ts';
import '@/ai/flows/chat-flow.ts'; // Added chat flow
import '@/ai/flows/define-word-flow.ts'; // Added dictionary flow

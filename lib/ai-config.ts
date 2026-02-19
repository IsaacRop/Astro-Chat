import { createOpenAI } from '@ai-sdk/openai';

// 1. Validate Environment Variables
const openAIKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!openAIKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
}
if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// 2. Create and Export Centralized Provider
export const openai = createOpenAI({
    apiKey: openAIKey,
});

// Export specific models for easier usage
export const chatModel = openai('gpt-4o-mini');
export const embeddingModel = openai.embedding('text-embedding-3-small');

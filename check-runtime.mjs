import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
    console.log('Testing Runtime...');
    try {
        const result = streamText({
            model: openai('gpt-4o-mini'),
            prompt: 'test',
        });

        const output = JSON.stringify({
            keys: Object.keys(result),
            hasToDataStreamResponse: typeof result.toDataStreamResponse === 'function',
            hasToTextStreamResponse: typeof result.toTextStreamResponse === 'function',
            hasToAIStreamResponse: typeof result.toAIStreamResponse === 'function'
        }, null, 2);

        fs.writeFileSync('runtime-check.json', output);
        console.log('Written to runtime-check.json');

    } catch (e) {
        console.error(e);
    }
}

run();

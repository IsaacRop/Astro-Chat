import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[Test API] Testing OpenAI connection...');
    console.log('[Test API] OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('[Test API] OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));

    try {
        const result = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: 'Say hello in one word.',
        });

        console.log('[Test API] Success! Response:', result.text);
        return NextResponse.json({
            success: true,
            response: result.text,
            apiKeyExists: !!process.env.OPENAI_API_KEY
        });
    } catch (error) {
        console.error('[Test API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            apiKeyExists: !!process.env.OPENAI_API_KEY
        }, { status: 500 });
    }
}

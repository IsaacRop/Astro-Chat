import { generateText, embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Ollama provider for local models
const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

// Allow up to 60 seconds for processing
export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        // Combine all messages into a conversation string for topic extraction
        const conversationText = messages
            .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
            .join('\n');

        // Step A: Extract topic label using llama3.2
        console.log('[Graph API] Extracting topic from conversation...');

        const topicResult = await generateText({
            model: ollama.chat('llama3.2'),
            prompt: `Analyze this study conversation and extract the main topic being discussed.
Return ONLY a short label in the format "Topic: Subtopic" (e.g., "Math: Logarithms", "Physics: Kinematics", "Biology: Cell Division").
Keep it under 30 characters. Do not include any explanation.

Conversation:
${conversationText}

Topic Label:`,
        });

        const label = topicResult.text.trim().replace(/^["']|["']$/g, '');
        console.log('[Graph API] Extracted label:', label);

        // Step B: Generate embedding using nomic-embed-text
        console.log('[Graph API] Generating embedding...');

        const embeddingResult = await embed({
            model: ollama.embedding('nomic-embed-text'),
            value: label,
        });

        console.log('[Graph API] Embedding generated, dimension:', embeddingResult.embedding.length);

        return Response.json({
            label,
            embedding: embeddingResult.embedding,
        });
    } catch (error) {
        console.error('[Graph API] Error:', error);
        return Response.json(
            { error: 'Failed to process graph data' },
            { status: 500 }
        );
    }
}

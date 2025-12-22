import { generateText, embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Ollama provider for local models
const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

// System instruction to generate conversation titles
const SYSTEM_INSTRUCTION = `Você é um gerador de títulos. Analise a PRIMEIRA MENSAGEM DO USUÁRIO abaixo e crie um título curto e descritivo.

REGRAS OBRIGATÓRIAS:
1. O título deve ter 2-5 palavras
2. O título deve refletir EXATAMENTE o assunto da pergunta do usuário
3. Use português
4. Retorne APENAS o título, nada mais
5. NÃO use pontuação no final

EXEMPLOS:
- Pergunta: "O que é logaritmo?" → Título: Logaritmos
- Pergunta: "Me explica as leis de Newton" → Título: Leis de Newton
- Pergunta: "Como calcular a área de um círculo?" → Título: Área do Círculo
- Pergunta: "Quais foram as causas da primeira guerra mundial?" → Título: Causas da Primeira Guerra

CONVERSA:`;

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
            prompt: `${SYSTEM_INSTRUCTION}
${conversationText}

TÍTULO:`,
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

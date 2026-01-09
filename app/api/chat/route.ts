import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from '@ai-sdk/openai'

// A chave OPENAI_API_KEY é lida automaticamente pelo @ai-sdk/openai
// A variável de ambiente está definida em .env.local (protegida pelo .gitignore)

// System prompt for Otto - the educational AI assistant (optimized for conciseness)
const SYSTEM_PROMPT = `Você é o Otto, um assistente de inteligência artificial especializado em tutoria educacional.

SUA MISSÃO:
Ajudar o usuário a dominar qualquer tema de forma clara, rápida e direta.

DIRETRIZES DE PERSONALIDADE:
- **Didático e Objetivo:** Vá direto ao ponto.
- **Entusiasta:** Demonstre paixão por ensinar.
- **Linguagem Acessível:** Evite termos técnicos sem explicá-los.

REGRAS DE ATUAÇÃO:
1. **Explicação em Níveis:** Se o tema for difícil, simplifique primeiro.
2. **Analogias:** Use analogias do mundo real quando útil.
3. **Interatividade:** Faça perguntas curtas ao final para testar compreensão.
4. **Resumo Visual:** Use listas e **negrito** para destacar termos.

FORMATAÇÃO:
- Use Markdown para estruturar.
- Parágrafos curtos para leitura fácil.

RESTRIÇÃO CRÍTICA:
- **Mantenha respostas curtas e focadas.** Evite textos longos. Priorize clareza sobre completude.
- Nunca forneça respostas prontas sem explicar o raciocínio.`;

// Safety & Cost Configuration
const MAX_CONTEXT_MESSAGES = 6; // Limit context window to prevent token explosion
const MAX_OUTPUT_TOKENS = 500;  // Limit response length

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const rawMessages = body.messages || [];

        console.log('[Chat API] Received messages:', rawMessages.length);

        // Safety: Truncate context to last N messages to reduce token costs
        const truncatedMessages = rawMessages.slice(-MAX_CONTEXT_MESSAGES);
        console.log('[Chat API] Truncated to last', truncatedMessages.length, 'messages');

        // Normalize messages to ensure they have the parts array format
        // This handles both legacy (content field) and new (parts array) formats
        const normalizedMessages: UIMessage[] = truncatedMessages.map((message: {
            id: string;
            role: 'user' | 'assistant' | 'system';
            content?: string;
            parts?: Array<{ type: string; text?: string }>;
        }) => {
            // If message already has parts, use it as is
            if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
                return message as UIMessage;
            }

            // Convert legacy content field to parts array
            const textContent = message.content || '';
            return {
                id: message.id,
                role: message.role,
                parts: [{ type: 'text' as const, text: textContent }],
            } as UIMessage;
        });

        console.log('[Chat API] Normalized messages:', normalizedMessages.length);

        // Convert UIMessages to ModelMessages using the official AI SDK v6 helper
        const modelMessages = await convertToModelMessages(normalizedMessages);

        console.log('[Chat API] Converted to model messages:', modelMessages.length);
        console.log('[Chat API] Calling OpenAI with maxTokens:', MAX_OUTPUT_TOKENS);

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            maxOutputTokens: MAX_OUTPUT_TOKENS, // Limit output to prevent runaway responses
        });

        console.log('[Chat API] Streaming response...');
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('[Chat API] Error:', error);
        console.error('[Chat API] Error details:', error instanceof Error ? error.stack : String(error));
        return new Response(JSON.stringify({
            error: 'Failed to process chat',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

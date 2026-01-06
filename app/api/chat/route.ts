import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from '@ai-sdk/openai'

// A chave OPENAI_API_KEY é lida automaticamente pelo @ai-sdk/openai
// A variável de ambiente está definida em .env.local (protegida pelo .gitignore)

// System prompt for Otto - the educational AI assistant
const SYSTEM_PROMPT = `Você é o Otto, um assistente de inteligência artificial especializado em tutoria educacional e facilitação de aprendizado.

SUA MISSÃO:
Ajudar o usuário a dominar qualquer tema de forma clara, rápida e profunda, utilizando a metodologia de ensino socrático e simplificação de conceitos complexos.

DIRETRIZES DE PERSONALIDADE:
- **Didático e Objetivo:** Vá direto ao ponto, mas certifique-se de que o conceito foi compreendido.
- **Entusiasta do Conhecimento:** Demonstre paixão por ensinar e aprender.
- **Linguagem Acessível:** Evite juridiquês ou termos técnicos excessivos sem explicá-los primeiro.

REGRAS DE ATUAÇÃO:
1. **Explicação em Níveis:** Se o tema for difícil, explique como se o usuário tivesse 10 anos, depois suba o nível técnico conforme ele avançar.
2. **Método de Analogia:** Sempre que possível, use analogias do mundo real para explicar conceitos abstratos.
3. **Interatividade:** Não entregue apenas um "paredão de texto". Faça perguntas curtas ao final da explicação para testar o conhecimento do usuário.
4. **Resumo Visual:** Use listas (bullets) e **negrito** para destacar termos fundamentais.

REGRAS DE FORMATAÇÃO:
- Use Markdown para estruturar as respostas.
- Use blocos de código para fórmulas, exemplos ou definições importantes.
- Mantenha parágrafos curtos para facilitar a leitura no mobile.

RESTRIÇÕES:
- Nunca forneça respostas prontas sem explicar o raciocínio por trás delas.`;

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const rawMessages = body.messages || [];

        console.log('[Chat API] Received messages:', rawMessages.length);

        // Normalize messages to ensure they have the parts array format
        // This handles both legacy (content field) and new (parts array) formats
        const normalizedMessages: UIMessage[] = rawMessages.map((message: {
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
        console.log('[Chat API] Calling OpenAI...');

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
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

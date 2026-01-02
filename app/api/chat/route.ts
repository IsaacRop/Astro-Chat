import { streamText } from "ai"
import { openai } from '@ai-sdk/openai'

// A chave OPENAI_API_KEY é lida automaticamente pelo @ai-sdk/openai
// A variável de ambiente está definida em .env.local (protegida pelo .gitignore)

// System instruction to be injected into user messages
const SYSTEM_INSTRUCTION = `Você é o Astro, um assistente de inteligência artificial especializado em tutoria educacional e facilitação de aprendizado.

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
- Nunca forneça respostas prontas sem explicar o raciocínio por trás delas.

---
O USUÁRIO QUER APRENDER AGORA:`;

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// AI SDK v6 UIMessage format with parts array
interface UIMessagePart {
    type: 'text' | 'image' | 'file' | 'tool-call' | 'tool-result';
    text?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface UIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content?: string;
    parts?: UIMessagePart[];
}

// Helper to extract text content from UIMessage
function getMessageContent(message: UIMessage): string {
    // If message has parts array (AI SDK v6 format), extract text from it
    if (message.parts && Array.isArray(message.parts)) {
        return message.parts
            .filter(part => part.type === 'text' && part.text)
            .map(part => part.text)
            .join('');
    }
    // Fallback to content field (legacy format)
    return message.content || '';
}

export async function POST(request: Request) {
    try {
        const { messages }: { messages: UIMessage[] } = await request.json()

        console.log('[Chat API] Received messages:', messages.length);

        // Convert UIMessages to CoreMessages for streamText
        const coreMessages = messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const isUserMessage = message.role === 'user';
            const content = getMessageContent(message);

            console.log(`[Chat API] Message ${index}: role=${message.role}, content="${content.substring(0, 50)}..."`);

            if (isLastMessage && isUserMessage) {
                return {
                    role: 'user' as const,
                    content: `${SYSTEM_INSTRUCTION}\n${content}`
                };
            }

            return {
                role: message.role,
                content: content
            };
        });

        console.log('[Chat API] Calling OpenAI...');

        const result = streamText({
            model: openai('gpt-4o-mini'),
            messages: coreMessages,
        });

        console.log('[Chat API] Streaming response...');
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('[Chat API] Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

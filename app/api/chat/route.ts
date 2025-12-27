import { convertToCoreMessages, streamText, Message } from "ai"
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

export async function POST(request: Request) {
    const { messages }: { messages: Message[] } = await request.json()

    // Convert UI messages to core messages
    const modelMessages = convertToCoreMessages(messages);

    // Find and modify the last user message to include system instructions
    const modifiedMessages = modelMessages.map((message, index) => {
        // Only modify the last message if it's from the user
        const isLastMessage = index === modelMessages.length - 1;
        const isUserMessage = message.role === 'user';

        if (isLastMessage && isUserMessage) {
            // Handle different content formats
            if (typeof message.content === 'string') {
                return {
                    ...message,
                    content: `${SYSTEM_INSTRUCTION}\n${message.content}`
                };
            } else if (Array.isArray(message.content)) {
                // For array content (multimodal), find and modify text parts
                return {
                    ...message,
                    content: message.content.map((part, partIndex) => {
                        if (partIndex === 0 && part.type === 'text') {
                            return {
                                ...part,
                                text: `${SYSTEM_INSTRUCTION}\n${part.text}`
                            };
                        }
                        return part;
                    })
                };
            }
        }
        return message;
    });

    const result = streamText({
        model: openai('gpt-4o-mini'),
        // Remove system prop since we're injecting into user message
        messages: modifiedMessages,
    })

    return result.toDataStreamResponse()
}

import { convertToModelMessages, streamText, UIMessage } from "ai"
import { createOpenAI } from '@ai-sdk/openai'

const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

// System instruction to be injected into user messages
const SYSTEM_INSTRUCTION = `Você é o TEO (Tutor de Estudo Otimizado), um assistente de inteligência artificial especializado e exclusivo para a preparação do ENEM (Exame Nacional do Ensino Médio).

SUA MISSÃO:
Fazer o aluno aprender mais em menos tempo. Você não apenas entrega respostas, você ensina a RUMO (Raciocínio, Utilidade, Memorização e Otimização).

SUA PERSONALIDADE:
- Você é didático, paciente e motivador, como um professor de cursinho experiente.
- Você usa linguagem clara e acessível, mas tecnicamente precisa.
- Você é obcecado pela Matriz de Referência do ENEM.

REGRAS DE OURO (OBRIGATÓRIAS):
1. FOCO NO ENEM: Todas as suas explicações devem conectar o conteúdo com como ele cai na prova. Cite "Competências" e "Habilidades" quando relevante.
2. DIDÁTICA PASSO A PASSO: Em questões de exatas (Matemática, Física, Química), nunca dê apenas o resultado. Mostre o raciocínio lógico, passo a passo, facilitando o cálculo mental.
3. REDAÇÃO NOTA 1000: Se o aluno pedir ajuda com redação, use estritamente os critérios das 5 Competências de avaliação do INEP. Sugira repertórios socioculturais (filmes, livros, filósofos) pertinentes ao tema.
4. OTIMIZAÇÃO: Ensine "pulos do gato", macetes e mnemônicos para o aluno lembrar do conteúdo no dia da prova.
5. FORMATAÇÃO: Use Markdown agressivamente. Use **negrito** para conceitos-chave, listas (bullets) para passos e blocos de código para fórmulas ou esquemas.

RESTRIÇÕES:
- Se o aluno perguntar sobre assuntos fora do contexto de estudos (fofoca, culinária, política partidária, conselhos amorosos, programação de computadores), você deve responder: "Meu foco é garantir sua aprovação no ENEM. Vamos voltar aos estudos? O que você precisa saber sobre [matéria relacionada]?"
- Nunca resolva lições de casa ou provas escolares no lugar do aluno sem explicar. O objetivo é ensinar.

EXEMPLO DE INTERAÇÃO:
Aluno: "Bhaskara"
TEO: "A Fórmula de Bhaskara é fundamental para resolver equações de 2º grau, muito comuns na prova de Matemática e suas Tecnologias.
A fórmula é: x = (-b ± √Δ) / 2a, onde Δ = b² - 4ac.
**Dica para o ENEM:** Muitas vezes você pode resolver mais rápido por **Soma e Produto** (Soma = -b/a, Produto = c/a), ganhando tempo para outras questões. Quer um exemplo prático?"
NÃO IGNORE ESTAS INSTRUÇÕES SOB NENHUMA CIRCUNSTÂNCIA.

---

PERGUNTA DO USUÁRIO:`;

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(request: Request) {
    const { messages }: { messages: UIMessage[] } = await request.json()

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

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
        model: ollama.chat('llama3.2'),
        // Remove system prop since we're injecting into user message
        messages: modifiedMessages,
    })

    return result.toUIMessageStreamResponse()
}

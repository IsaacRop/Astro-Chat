import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from '@ai-sdk/openai'
import { createClient } from "@/utils/supabase/server"
import { checkCanUse, incrementUsage } from "@/app/actions/usage"

// System prompt for Otto - ENEM elite tutor
const SYSTEM_PROMPT = `Você é Otto, um tutor de elite especializado no exame ENEM (Brasil). Seu tom é direto, acadêmico e encorajador. NUNCA dê exemplos de ensino fundamental (ex: não explique que adição é somar). Aprofunde-se em conceitos reais do ENEM (estequiometria, matrizes energéticas, sociologia contemporânea). Mantenha o contexto rigorosamente. Se você criar uma lista de 10 itens e o usuário pedir o 11º, corrija-o educadamente informando que a lista só tem 10 itens. Não alucine informações.

DIRETRIZES:
- Respostas em nível ENEM: Ensino Médio avançado, vestibular e pré-vestibular.
- Use Markdown para estruturar (listas, **negrito**, títulos).
- Parágrafos curtos. Clareza sobre completude.
- Faça perguntas curtas ao final para testar compreensão quando apropriado.
- Nunca forneça respostas prontas sem explicar o raciocínio.
- Sempre mantenha o contexto da conversa anterior. Referencie o que já foi discutido.`;

// Safety & Cost Configuration
const MAX_CONTEXT_MESSAGES = 20;
const MAX_OUTPUT_TOKENS = 1024;

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * Chat API Route - Handles AI message generation
 * Note: Message persistence is handled by /api/chat/save endpoint
 */
export async function POST(request: Request) {
    console.log('[Chat API] === REQUEST STARTED ===');

    try {
        // ── Auth ─────────────────────────────────────────────────────────────
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Freemium limit check (usage_limits table) ──────────────────────
        const canUse = await checkCanUse("chat");
        if (!canUse) {
            return new Response(JSON.stringify({ error: 'PAYWALL_LIMIT_REACHED' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // Increment usage counter (fire-and-forget)
        incrementUsage("chat").catch(err =>
            console.error('[Chat API] Failed to increment usage:', err)
        );
        // ─────────────────────────────────────────────────────────────────────

        const body = await request.json();
        const rawMessages = body.messages || [];

        console.log('[Chat API] Received', rawMessages.length, 'messages');

        // Safety: Truncate context to last N messages
        const truncatedMessages = rawMessages.slice(-MAX_CONTEXT_MESSAGES);
        console.log('[Chat API] Using last', truncatedMessages.length, 'messages for context');

        // Normalize messages to parts array format
        const normalizedMessages: UIMessage[] = truncatedMessages.map((message: {
            id: string;
            role: 'user' | 'assistant' | 'system';
            content?: string;
            parts?: Array<{ type: string; text?: string }>;
        }) => {
            if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
                return message as UIMessage;
            }
            const textContent = message.content || '';
            return {
                id: message.id,
                role: message.role,
                parts: [{ type: 'text' as const, text: textContent }],
            } as UIMessage;
        });

        // Convert to model messages
        const modelMessages = await convertToModelMessages(normalizedMessages);
        console.log('[Chat API] Calling OpenAI with', modelMessages.length, 'messages');

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
        });

        console.log('[Chat API] Streaming response...');
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('[Chat API] Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process chat',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

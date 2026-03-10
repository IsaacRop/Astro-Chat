import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from '@ai-sdk/openai'
import { createClient } from "@/utils/supabase/server"

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
const MAX_CONTEXT_MESSAGES = 6;
const MAX_OUTPUT_TOKENS = 500;
const FREE_DAILY_LIMIT = 10;

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * Chat API Route - Handles AI message generation
 * Note: Message persistence is handled by /api/chat/save endpoint
 */
export async function POST(request: Request) {
    console.log('[Chat API] === REQUEST STARTED ===');

    try {
        // ── Paywall Gate ─────────────────────────────────────────────────────
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('plan_tier, daily_message_count, last_message_date')
            .eq('id', user.id)
            .single();

        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const planTier = profile?.plan_tier ?? 'free';
        let dailyCount = profile?.daily_message_count ?? 0;

        // Reset counter if the stored date is not today
        if (profile?.last_message_date !== today) {
            dailyCount = 0;
        }

        // Block free-tier users who have hit the daily limit
        if (planTier === 'free' && dailyCount >= FREE_DAILY_LIMIT) {
            console.log(`[Chat API] Paywall triggered for user ${user.id} (count: ${dailyCount})`);
            return new Response(JSON.stringify({ error: 'PAYWALL_LIMIT_REACHED' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Increment usage counter (fire-and-forget — don't block the stream)
        supabase
            .from('profiles')
            .update({ daily_message_count: dailyCount + 1, last_message_date: today })
            .eq('id', user.id)
            .then(() => {
                console.log(`[Chat API] Updated message count to ${dailyCount + 1} for user ${user.id}`);
            });
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

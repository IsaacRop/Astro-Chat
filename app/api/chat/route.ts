import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from '@ai-sdk/openai'
import { createClient } from "@/utils/supabase/server"
import { getUserUsage, incrementUsage } from "@/app/actions/usage"
import { buildSystemPrompt } from "@/lib/prompts/otto-system"
import { addXP } from "@/lib/xp/actions"

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

        // ── Freemium limit check (5-hour rolling window) ───────────────────
        const usage = await getUserUsage("chat");
        if (!usage.isPro && usage.remaining <= 0) {
            const resetAt = usage.resetAt ?? new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
            return new Response(JSON.stringify({ error: 'PAYWALL_LIMIT_REACHED', reset_at: resetAt }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // Increment usage counter (fire-and-forget)
        incrementUsage("chat").catch(err =>
            console.error('[Chat API] Failed to increment usage:', err)
        );
        // XP: +1 por mensagem enviada pelo usuário
        addXP('chat_message').catch(console.error);
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

        // Extract last user message for dynamic context injection
        const lastUserMsg = [...normalizedMessages]
            .reverse()
            .find((m) => m.role === 'user');
        const lastUserText = lastUserMsg?.parts
            ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join(' ') ?? '';

        const systemPrompt = buildSystemPrompt(lastUserText);
        // Debug: ~800 base, +~500 per area block, +~400 for redação
        console.log('[Chat API] System prompt length:', systemPrompt.length, 'chars');

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
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

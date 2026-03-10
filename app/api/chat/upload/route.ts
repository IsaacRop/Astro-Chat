import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";
import { PDFParse } from "pdf-parse";

// ── Configuration ────────────────────────────────────────────────────────────
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

const MAX_CONTEXT_MESSAGES = 6;
const MAX_OUTPUT_TOKENS = 500;
const FREE_DAILY_LIMIT = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_TEXT_LENGTH = 12_000; // characters

const ALLOWED_MIMETYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * POST /api/chat/upload
 * Accepts FormData with `message`, `file` (optional), and `messages` (JSON string of history).
 */
export async function POST(request: Request) {
    console.log("[Chat Upload API] === REQUEST STARTED ===");

    try {
        // ── Auth & Paywall ───────────────────────────────────────────────
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("plan_tier, daily_message_count, last_message_date")
            .eq("id", user.id)
            .single();

        const today = new Date().toISOString().split("T")[0];
        const planTier = profile?.plan_tier ?? "free";
        let dailyCount = profile?.daily_message_count ?? 0;

        if (profile?.last_message_date !== today) {
            dailyCount = 0;
        }

        if (planTier === "free" && dailyCount >= FREE_DAILY_LIMIT) {
            return new Response(
                JSON.stringify({ error: "PAYWALL_LIMIT_REACHED" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // Increment usage counter (fire-and-forget)
        supabase
            .from("profiles")
            .update({
                daily_message_count: dailyCount + 1,
                last_message_date: today,
            })
            .eq("id", user.id)
            .then(() => {
                console.log(
                    `[Chat Upload API] Updated message count to ${dailyCount + 1}`
                );
            });

        // ── Parse FormData ───────────────────────────────────────────────
        const formData = await request.formData();
        const messageText = (formData.get("message") as string) || "";
        const file = formData.get("file") as File | null;
        const rawMessagesJson = (formData.get("messages") as string) || "[]";

        let historyMessages: Array<{
            id: string;
            role: "user" | "assistant" | "system";
            content?: string;
            parts?: Array<{ type: string; text?: string }>;
        }> = [];
        try {
            historyMessages = JSON.parse(rawMessagesJson);
        } catch {
            historyMessages = [];
        }

        // ── Validate file ────────────────────────────────────────────────
        if (file) {
            if (!ALLOWED_MIMETYPES.has(file.type)) {
                return new Response(
                    JSON.stringify({
                        error: `Tipo de arquivo não suportado: ${file.type}. Envie PDF, JPEG, PNG, WebP ou GIF.`,
                    }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            if (file.size > MAX_FILE_SIZE) {
                return new Response(
                    JSON.stringify({
                        error: "Arquivo muito grande. O limite é 10 MB.",
                    }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        // ── Build the new user message content ───────────────────────────
        type ContentPart =
            | { type: "text"; text: string }
            | { type: "image"; image: string; mimeType: string };

        let newUserContent: string | ContentPart[];

        if (file && file.type === "application/pdf") {
            // ── PDF: extract text ────────────────────────────────────────
            const arrayBuffer = await file.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            let extractedText = "";

            try {
                const parser = new PDFParse({ data });
                const textResult = await parser.getText();
                extractedText = (textResult.text || "").trim();
                await parser.destroy();
            } catch (pdfError) {
                console.error("[Chat Upload API] PDF parse error:", pdfError);
                return new Response(
                    JSON.stringify({
                        error: "Falha ao processar o PDF. Tente enviar outro arquivo.",
                    }),
                    { status: 500, headers: { "Content-Type": "application/json" } }
                );
            }

            if (!extractedText || extractedText.length < 10) {
                return new Response(
                    JSON.stringify({
                        error: "Este PDF não contém texto legível (pode ser um PDF escaneado). Tente enviar como imagem.",
                    }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            // Truncate if too long
            if (extractedText.length > MAX_PDF_TEXT_LENGTH) {
                extractedText =
                    extractedText.slice(0, MAX_PDF_TEXT_LENGTH) +
                    "\n\n[... texto truncado por limite de tamanho ...]";
            }

            const fullMessage = messageText
                ? `${messageText}\n\nConteúdo do arquivo PDF:\n${extractedText}`
                : `Conteúdo do arquivo PDF:\n${extractedText}`;

            newUserContent = fullMessage;
            console.log(
                `[Chat Upload API] PDF processed: ${extractedText.length} chars extracted`
            );
        } else if (file && file.type.startsWith("image/")) {
            // ── Image: convert to base64 for vision ──────────────────────
            const buffer = Buffer.from(await file.arrayBuffer());
            const base64 = buffer.toString("base64");
            const dataUrl = `data:${file.type};base64,${base64}`;

            newUserContent = [
                { type: "image" as const, image: dataUrl, mimeType: file.type },
                {
                    type: "text" as const,
                    text: messageText || "O que você vê nesta imagem?",
                },
            ];
            console.log("[Chat Upload API] Image processed for vision");
        } else {
            // ── No file: text only ───────────────────────────────────────
            newUserContent = messageText;
        }

        // ── Build messages array for the model ───────────────────────────
        const truncatedHistory = historyMessages.slice(-MAX_CONTEXT_MESSAGES);

        const normalizedHistory: UIMessage[] = truncatedHistory.map(
            (message) => {
                if (
                    message.parts &&
                    Array.isArray(message.parts) &&
                    message.parts.length > 0
                ) {
                    return message as UIMessage;
                }
                const textContent = message.content || "";
                return {
                    id: message.id,
                    role: message.role,
                    parts: [{ type: "text" as const, text: textContent }],
                } as UIMessage;
            }
        );

        // Convert history to model messages
        const modelMessages = normalizedHistory.length > 0
            ? await convertToModelMessages(normalizedHistory)
            : [];

        // Add the new user message with file content
        if (typeof newUserContent === "string") {
            modelMessages.push({
                role: "user" as const,
                content: [{ type: "text" as const, text: newUserContent }],
            });
        } else {
            // Image vision content
            modelMessages.push({
                role: "user" as const,
                content: newUserContent.map((part) => {
                    if (part.type === "image") {
                        return {
                            type: "image" as const,
                            image: new URL(part.image),
                            mimeType: part.mimeType,
                        };
                    }
                    return { type: "text" as const, text: part.text };
                }),
            });
        }

        console.log(
            `[Chat Upload API] Calling OpenAI with ${modelMessages.length} messages`
        );

        // ── Stream the response ──────────────────────────────────────────
        const result = streamText({
            model: openai("gpt-4o-mini"),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
        });

        console.log("[Chat Upload API] Streaming response...");
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("[Chat Upload API] Error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to process upload",
                details: error instanceof Error ? error.message : String(error),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

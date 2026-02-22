import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateText, embed } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { chatId, role, content } = await request.json();

        if (!chatId || !role || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify chat belongs to user
        const { data: chat, error: chatError } = await supabase
            .from("chats")
            .select("user_id, title")
            .eq("id", chatId)
            .single();

        if (chatError || !chat || chat.user_id !== user.id) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        // Insert message
        const { error: messageError } = await supabase.from("messages").insert({
            chat_id: chatId,
            role,
            content,
        });

        if (messageError) {
            console.error("[Chat Save] Failed to save message:", messageError);
            return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
        }

        // Update chat's updated_at
        await supabase.from("chats").update({
            updated_at: new Date().toISOString(),
        }).eq("id", chatId);

        // Auto-title logic: When saving assistant message, check if we should generate a title
        if (role === "assistant" && (!chat.title || chat.title === "Nova Conversa")) {
            try {
                // Check message count
                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: 'exact', head: true })
                    .eq("chat_id", chatId);

                // Generate title only for early conversations (≤2 messages = first exchange)
                if (count !== null && count <= 2) {
                    console.log("[Chat Save] Generating auto-title for chat:", chatId);

                    // Get the user's first message for context
                    const { data: firstMessage } = await supabase
                        .from("messages")
                        .select("content")
                        .eq("chat_id", chatId)
                        .eq("role", "user")
                        .order("created_at", { ascending: true })
                        .limit(1)
                        .single();

                    const userContent = firstMessage?.content || "";

                    // Generate a short title
                    const titleResult = await generateText({
                        model: openai('gpt-4o-mini'),
                        prompt: `Extraia APENAS o tema central de estudo ou conceito acadêmico desta conversa em no máximo 4 palavras. 

Regras absolutas:
1. Ignore completamente saudações, cordialidades, ou descrições de ações (como "pedido de ajuda", "assistência", "dúvida").
2. Retorne ESTRITAMENTE o nome da matéria ou conceito (ex: "Revolução Francesa", "Cálculo Integral", "Fotossíntese").
3. Se o usuário mandou apenas um "oi" ou a mensagem ainda não tem um assunto de estudo claro, retorne EXATAMENTE a frase: "Assunto Indefinido".
4. Sem aspas, sem pontuação final, apenas o termo.

Mensagem do usuário: "${userContent.slice(0, 200)}"
Resposta do assistente: "${content.slice(0, 200)}"`,
                        maxOutputTokens: 20,
                    });

                    const generatedTitle = titleResult.text.trim().slice(0, 50);
                    console.log("[Chat Save] Generated title:", generatedTitle);

                    // Generate Vector Embedding for the title using OpenAI
                    const { embedding } = await embed({
                        model: openai.embedding('text-embedding-3-small'),
                        value: generatedTitle,
                    });

                    // Update the chat title and embedding vector
                    await supabase
                        .from("chats")
                        .update({
                            title: generatedTitle,
                            embedding: embedding
                        })
                        .eq("id", chatId);
                }
            } catch (titleError) {
                console.error("[Chat Save] Auto-title error:", titleError);
                // Don't fail the request if titling fails
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Chat Save] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

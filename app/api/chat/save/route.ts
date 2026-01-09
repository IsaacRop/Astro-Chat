import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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
            .select("user_id")
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Chat Save] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

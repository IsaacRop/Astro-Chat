import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/chat/create
 * Lazy chat creation endpoint — only called when the user sends their first message.
 * Returns the new chat ID.
 */
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("chats")
            .insert({
                user_id: user.id,
                title: "Nova Conversa",
            })
            .select("id")
            .single();

        if (error) {
            console.error("[Chat Create] Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("[Chat Create] ✓ Chat created lazily:", data.id);
        return NextResponse.json({ id: data.id });
    } catch (error) {
        console.error("[Chat Create] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

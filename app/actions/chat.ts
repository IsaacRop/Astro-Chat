"use server";

import { createClient } from "@/utils/supabase/server";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export interface ChatSession {
    id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Get all messages for a chat
 */
export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[Chat DB] Failed to load messages:", error);
        return [];
    }

    return (data || []) as ChatMessage[];
}

/**
 * Get all chats for the current user
 */
export async function getUserChats(): Promise<ChatSession[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("chats")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[Chat DB] Failed to load chats:", error);
        return [];
    }

    return (data || []) as ChatSession[];
}

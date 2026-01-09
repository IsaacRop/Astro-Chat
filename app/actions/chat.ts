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
 * Create a new chat session in Supabase
 * @throws Error if user is not authenticated or insert fails
 */
export async function createChatSession(title?: string): Promise<string> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("[createChatSession] No authenticated user");
        throw new Error("Not authenticated");
    }

    console.log("[createChatSession] Creating chat for user:", user.id);

    const { data, error } = await supabase
        .from("chats")
        .insert({
            user_id: user.id,
            title: title || "Nova Conversa",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[createChatSession] Supabase error:", error.message, error.code);
        throw new Error(`Failed to create chat: ${error.message}`);
    }

    if (!data) {
        console.error("[createChatSession] No data returned");
        throw new Error("No data returned from insert");
    }

    console.log("[createChatSession] ✓ Chat created:", data.id);
    return data.id;
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

/**
 * Update chat title
 */
export async function updateChatTitle(chatId: string, title: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("chats")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", chatId);

    if (error) {
        console.error("[Chat DB] Failed to update title:", error);
        return false;
    }

    return true;
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChatSession(chatId: string): Promise<boolean> {
    const supabase = await createClient();

    // Messages will be cascade deleted if FK is set up, otherwise delete manually
    await supabase.from("messages").delete().eq("chat_id", chatId);

    const { error } = await supabase.from("chats").delete().eq("id", chatId);

    if (error) {
        console.error("[Chat DB] Failed to delete chat:", error);
        return false;
    }

    return true;
}

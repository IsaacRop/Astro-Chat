"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Create a new chat session
 * @returns The new chat ID
 */
export async function createNewChat(): Promise<{ id: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
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
        console.error("[createNewChat] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

/**
 * Create a new note
 * @returns The new note ID
 */
export async function createNewNote(): Promise<{ id: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("notes")
        .insert({
            user_id: user.id,
            title: "Sem título",
            content: "",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[createNewNote] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

/**
 * Create a new idea
 * @returns The new idea ID
 */
export async function createNewIdea(): Promise<{ id: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("ideas")
        .insert({
            user_id: user.id,
            content: "",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[createNewIdea] Error:", error);
        throw new Error(error.message);
    }

    return { id: data.id };
}

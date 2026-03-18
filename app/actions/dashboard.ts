"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Records the user's daily login and updates their streak counter.
 * - If last_login_date is yesterday → increment streak
 * - If last_login_date is today → no-op (already counted)
 * - Otherwise → reset streak to 1
 * Returns the current streak value.
 */
export async function recordLoginStreak(): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { data: profile } = await supabase
        .from("profiles")
        .select("login_streak, last_login_date")
        .eq("id", user.id)
        .single();

    if (!profile) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Already recorded today
    if (profile.last_login_date === todayStr) {
        return profile.login_streak ?? 0;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newStreak = profile.last_login_date === yesterdayStr
        ? (profile.login_streak ?? 0) + 1
        : 1;

    await supabase
        .from("profiles")
        .update({ login_streak: newStreak, last_login_date: todayStr })
        .eq("id", user.id);

    return newStreak;
}

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

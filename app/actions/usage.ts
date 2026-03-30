"use server";

import { createClient } from "@/utils/supabase/server";

// ── Constants ────────────────────────────────────────────────────────────────

type ResourceType = "exam" | "flashcard" | "chat";

const FREE_LIMITS: Record<ResourceType, number> = {
    exam: 3,
    flashcard: 3,
    chat: 10,
};

const WINDOW_HOURS = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format time remaining until a reset timestamp, in pt-BR.
 */
function getResetsAtLabel(resetAt: Date | null): string {
    if (!resetAt) return "";
    const now = new Date();
    const diffMs = resetAt.getTime() - now.getTime();
    if (diffMs <= 0) return "em breve";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
        return `Renova em ${hours}h ${minutes}min`;
    }
    return `Renova em ${minutes}min`;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the user's current plan tier.
 */
export async function getUserPlan(): Promise<"free" | "pro"> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "free";

    const { data: profile } = await supabase
        .from("profiles")
        .select("plan_tier")
        .eq("id", user.id)
        .single();

    return (profile?.plan_tier === "pro") ? "pro" : "free";
}

/**
 * Get usage stats for a given resource type.
 * Uses a rolling 5-hour window keyed on the reset_at column.
 */
export async function getUserUsage(resourceType: ResourceType): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
    resetAt: string | null;
    isPro: boolean;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { used: 0, limit: 0, remaining: 0, resetsAt: "", resetAt: null, isPro: false };
    }

    // Check plan
    const { data: profile } = await supabase
        .from("profiles")
        .select("plan_tier")
        .eq("id", user.id)
        .single();

    const isPro = profile?.plan_tier === "pro";

    if (isPro) {
        return { used: 0, limit: -1, remaining: -1, resetsAt: "", resetAt: null, isPro: true };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data } = await sb
        .from("usage_limits")
        .select("usage_count, reset_at")
        .eq("user_id", user.id)
        .eq("resource_type", resourceType)
        .single();

    const now = new Date();
    const resetAt = data?.reset_at ? new Date(data.reset_at) : null;
    const isExpired = !resetAt || now > resetAt;

    const used = isExpired ? 0 : (data?.usage_count ?? 0);
    const limit = FREE_LIMITS[resourceType];
    const remaining = Math.max(0, limit - used);
    const effectiveResetAt = isExpired ? null : resetAt;

    return {
        used,
        limit,
        remaining,
        resetsAt: getResetsAtLabel(effectiveResetAt),
        resetAt: effectiveResetAt?.toISOString() ?? null,
        isPro: false,
    };
}

/**
 * Check if the user can use a given resource.
 * Returns true if pro or under limit.
 */
export async function checkCanUse(resourceType: ResourceType): Promise<boolean> {
    const usage = await getUserUsage(resourceType);
    if (usage.isPro) return true;
    return usage.remaining > 0;
}

/**
 * Increment the usage counter for a resource type using a 5-hour rolling window.
 * Creates or resets the row as needed.
 */
export async function incrementUsage(resourceType: ResourceType): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: existing } = await sb
        .from("usage_limits")
        .select("id, usage_count, reset_at")
        .eq("user_id", user.id)
        .eq("resource_type", resourceType)
        .single();

    const now = new Date();
    const resetAt = existing?.reset_at ? new Date(existing.reset_at) : null;
    const isExpired = !resetAt || now > resetAt;
    const newResetAt = new Date(Date.now() + WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    if (existing && !isExpired) {
        // Active window — just increment
        await sb
            .from("usage_limits")
            .update({ usage_count: existing.usage_count + 1 })
            .eq("id", existing.id);
    } else if (existing && isExpired) {
        // Window expired — reset counter and open a new window
        await sb
            .from("usage_limits")
            .update({ usage_count: 1, reset_at: newResetAt })
            .eq("id", existing.id);
    } else {
        // No row yet — create it
        await sb
            .from("usage_limits")
            .insert({
                user_id: user.id,
                resource_type: resourceType,
                usage_count: 1,
                reset_at: newResetAt,
            });
    }
}

"use server";

import { createClient } from "@/utils/supabase/server";

// ── Constants ────────────────────────────────────────────────────────────────

type ResourceType = "exam" | "flashcard" | "chat";

const FREE_LIMITS: Record<ResourceType, number> = {
    exam: 3,
    flashcard: 3,
    chat: 10,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get today's date in UTC as YYYY-MM-DD string
 */
function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate time until next midnight UTC, formatted in pt-BR
 */
function getResetsAtLabel(): string {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
    ));
    const diffMs = nextMidnight.getTime() - now.getTime();
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
 * TODO: Integrate with Stripe subscription status for real-time checks.
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
 */
export async function getUserUsage(resourceType: ResourceType): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
    isPro: boolean;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { used: 0, limit: 0, remaining: 0, resetsAt: "", isPro: false };
    }

    // Check plan
    const { data: profile } = await supabase
        .from("profiles")
        .select("plan_tier")
        .eq("id", user.id)
        .single();

    const isPro = profile?.plan_tier === "pro";

    if (isPro) {
        return { used: 0, limit: -1, remaining: -1, resetsAt: "", isPro: true };
    }

    const today = todayUTC();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data } = await sb
        .from("usage_limits")
        .select("usage_count")
        .eq("user_id", user.id)
        .eq("resource_type", resourceType)
        .eq("usage_date", today)
        .single();

    const used = data?.usage_count ?? 0;
    const limit = FREE_LIMITS[resourceType];
    const remaining = Math.max(0, limit - used);

    return {
        used,
        limit,
        remaining,
        resetsAt: getResetsAtLabel(),
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
 * Increment the usage counter for a resource type.
 * Uses upsert to handle first-use and subsequent uses.
 */
export async function incrementUsage(resourceType: ResourceType): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = todayUTC();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Try to get existing record
    const { data: existing } = await sb
        .from("usage_limits")
        .select("id, usage_count")
        .eq("user_id", user.id)
        .eq("resource_type", resourceType)
        .eq("usage_date", today)
        .single();

    if (existing) {
        // Update existing
        await sb
            .from("usage_limits")
            .update({ usage_count: existing.usage_count + 1 })
            .eq("id", existing.id);
    } else {
        // Insert new
        await sb
            .from("usage_limits")
            .insert({
                user_id: user.id,
                resource_type: resourceType,
                usage_date: today,
                usage_count: 1,
            });
    }
}

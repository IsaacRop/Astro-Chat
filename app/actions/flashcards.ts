"use server";

import { createClient } from "@/utils/supabase/server";

// ============================================
// TYPES
// ============================================

export interface FlashcardDeck {
    id: string;
    title: string;
    topic: string;
    card_count: number;
    cards_reviewed: number;
    cards_correct: number;
    status: string;
    ai_feedback: string | null;
    created_at: string;
}

export interface FlashcardCard {
    id: string;
    deck_id: string;
    card_number: number;
    front: string;
    back: string;
    user_knew: boolean | null;
    reviewed_at: string | null;
    created_at: string;
}

export interface DeckWithCards extends FlashcardDeck {
    cards: FlashcardCard[];
}

// ============================================
// QUERIES
// ============================================

/**
 * List all flashcard decks for the current user, sorted by created_at desc.
 */
export async function getUserDecks(): Promise<FlashcardDeck[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("flashcard_decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[getUserDecks] Error:", error);
        return [];
    }

    return (data || []) as FlashcardDeck[];
}

/**
 * Get a deck with all its cards.
 */
export async function getDeckWithCards(deckId: string): Promise<DeckWithCards | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: deck, error: deckError } = await sb
        .from("flashcard_decks")
        .select("*")
        .eq("id", deckId)
        .eq("user_id", user.id)
        .single();

    if (deckError || !deck) {
        console.error("[getDeckWithCards] Error:", deckError);
        return null;
    }

    const { data: cards, error: cardsError } = await sb
        .from("flashcard_cards")
        .select("*")
        .eq("deck_id", deckId)
        .order("card_number", { ascending: true });

    if (cardsError) {
        console.error("[getDeckWithCards] Cards error:", cardsError);
        return null;
    }

    return {
        ...(deck as FlashcardDeck),
        cards: (cards || []) as FlashcardCard[],
    };
}

// ============================================
// MUTATIONS (delegate to API routes)
// ============================================

/**
 * Generate a new flashcard deck via AI.
 */
export async function generateDeck(
    topic: string,
    cardCount: number
): Promise<{ deckId: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/flashcards/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, cardCount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate deck");
    }

    return response.json();
}

/**
 * Review a single flashcard.
 */
export async function reviewCard(
    deckId: string,
    cardId: string,
    knew: boolean
): Promise<{ success: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/flashcards/${deckId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, knew }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to review card");
    }

    return response.json();
}

/**
 * Finish a deck review and get AI feedback.
 */
export async function finishDeck(deckId: string): Promise<{ deck: FlashcardDeck; cards: FlashcardCard[] }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/flashcards/${deckId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to finish deck");
    }

    return response.json();
}

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify deck belongs to user
        const { data: deck, error: deckError } = await sb
            .from("flashcard_decks")
            .select("id, user_id, cards_reviewed, cards_correct")
            .eq("id", deckId)
            .single();

        if (deckError || !deck || deck.user_id !== user.id) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        const { cardId, knew } = await request.json();

        if (!cardId || typeof knew !== "boolean") {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify card belongs to this deck
        const { data: card, error: cardError } = await sb
            .from("flashcard_cards")
            .select("id")
            .eq("id", cardId)
            .eq("deck_id", deckId)
            .single();

        if (cardError || !card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // Update card
        const { error: updateCardError } = await sb
            .from("flashcard_cards")
            .update({
                user_knew: knew,
                reviewed_at: new Date().toISOString(),
            })
            .eq("id", cardId);

        if (updateCardError) {
            console.error("[Flashcard Review] Failed to update card:", updateCardError);
            return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
        }

        // Increment deck counters
        const { error: updateDeckError } = await sb
            .from("flashcard_decks")
            .update({
                cards_reviewed: deck.cards_reviewed + 1,
                cards_correct: knew ? deck.cards_correct + 1 : deck.cards_correct,
            })
            .eq("id", deckId);

        if (updateDeckError) {
            console.error("[Flashcard Review] Failed to update deck:", updateDeckError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Flashcard Review] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

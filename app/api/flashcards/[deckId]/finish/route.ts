import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;

export async function POST(
    _request: Request,
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
            .select("*")
            .eq("id", deckId)
            .single();

        if (deckError || !deck || deck.user_id !== user.id) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        // Get all cards
        const { data: cards, error: cardsError } = await sb
            .from("flashcard_cards")
            .select("*")
            .eq("deck_id", deckId)
            .order("card_number", { ascending: true });

        if (cardsError || !cards) {
            return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
        }

        // Compute results from actual card data
        const reviewed = cards.filter((c: { user_knew: boolean | null }) => c.user_knew !== null).length;
        const correct = cards.filter((c: { user_knew: boolean | null }) => c.user_knew === true).length;
        const total = cards.length;

        // Build list of cards the user didn't know
        const unknownCards = cards
            .filter((c: { user_knew: boolean | null }) => c.user_knew === false)
            .map((c: { front: string }) => c.front)
            .join("\n- ");

        // Generate AI feedback
        const feedbackPrompt = `Você é um tutor educacional analisando uma revisão de flashcards sobre ${deck.topic}.

Resultado: ${correct}/${total} cards marcados como 'sei'
Cards que o aluno NÃO sabia:
- ${unknownCards || "Nenhum — sabia tudo!"}

Gere um feedback em português com:
1. Avaliação geral (2-3 frases)
2. Conceitos que o aluno domina
3. Conceitos que precisam de revisão (liste os específicos)
4. Sugestão de próximo passo de estudo

Máximo 150 palavras.`;

        const feedbackResult = await generateText({
            model: openai("gpt-4o-mini"),
            messages: [{ role: "user", content: feedbackPrompt }],
            maxOutputTokens: 400,
            temperature: 0.7,
        });

        const aiFeedback = feedbackResult.text.trim();

        // Update deck record
        const { error: updateError } = await sb
            .from("flashcard_decks")
            .update({
                status: "completed",
                cards_reviewed: reviewed,
                cards_correct: correct,
                ai_feedback: aiFeedback,
            })
            .eq("id", deckId);

        if (updateError) {
            console.error("[Flashcard Finish] Failed to update deck:", updateError);
            return NextResponse.json({ error: "Failed to finalize deck" }, { status: 500 });
        }

        return NextResponse.json({
            deck: {
                ...deck,
                status: "completed",
                cards_reviewed: reviewed,
                cards_correct: correct,
                ai_feedback: aiFeedback,
            },
            cards,
        });
    } catch (error) {
        console.error("[Flashcard Finish] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

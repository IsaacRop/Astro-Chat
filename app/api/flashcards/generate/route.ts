import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;

const FLASHCARDS_PROMPT = (topic: string, cardCount: number) =>
    `Você é um professor especialista criando flashcards de estudo sobre o tema: ${topic}. Gere ${cardCount} flashcards.

Cada flashcard DEVE ter:
- front: uma pergunta, conceito ou termo (curto e direto)
- back: a resposta ou explicação (clara, 2-3 frases máximo)

Cubra os pontos mais importantes do tema. Varie entre definições, fórmulas, datas, conceitos e aplicações práticas.

Responda APENAS com JSON array:
[{"front":"...","back":"..."}]`;

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { topic, cardCount } = await request.json();

        if (!topic || !cardCount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await generateText({
            model: openai("gpt-4o-mini"),
            system: FLASHCARDS_PROMPT(topic, cardCount),
            messages: [{ role: "user", content: `Gere ${cardCount} flashcards sobre: ${topic}` }],
            maxOutputTokens: cardCount * 200,
            temperature: 0.7,
        });

        // Parse JSON response
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error("[Flashcards Generate] Failed to parse AI response:", result.text);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        const cards = JSON.parse(jsonMatch[0]);

        // Create deck record
        const { data: deck, error: deckError } = await sb
            .from("flashcard_decks")
            .insert({
                user_id: user.id,
                title: `Flashcards: ${topic}`,
                topic,
                card_count: cardCount,
            })
            .select("id")
            .single();

        if (deckError || !deck) {
            console.error("[Flashcards Generate] Failed to create deck:", deckError);
            return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
        }

        // Create card records
        const cardRecords = cards.map((c: { front: string; back: string }, index: number) => ({
            deck_id: deck.id,
            card_number: index + 1,
            front: c.front,
            back: c.back,
        }));

        const { error: cardsError } = await sb
            .from("flashcard_cards")
            .insert(cardRecords);

        if (cardsError) {
            console.error("[Flashcards Generate] Failed to create cards:", cardsError);
            await sb.from("flashcard_decks").delete().eq("id", deck.id);
            return NextResponse.json({ error: "Failed to save cards" }, { status: 500 });
        }

        return NextResponse.json({ deckId: deck.id });
    } catch (error) {
        console.error("[Flashcards Generate] Error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}

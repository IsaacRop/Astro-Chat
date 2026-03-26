import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";
import { checkCanUse, incrementUsage } from "@/app/actions/usage";
import { retrieveEnemQuestions, EnemQuestion } from "@/lib/rag/enem-retriever";

export const maxDuration = 60;

const FLASHCARDS_PROMPT = (topic: string, cardCount: number) =>
    `You are an ENEM flashcard generator. Create flashcards that prepare students for the ENEM exam.

Gere ${cardCount} flashcards sobre o tema: ${topic}.

STRICT RULES:
- Write in clear, concise Brazilian Portuguese
- Front (frente): a question or incomplete sentence that tests a specific ENEM-relevant concept — phrased the way ENEM would test it, not as a textbook definition
- Back (verso): a direct, complete answer — include the key reasoning or mechanism, not just a keyword
- Difficulty and framing must match ENEM: applied, contextual, interdisciplinary when relevant
- Do NOT generate flashcards that ask "O que é X" — always test application or interpretation
- Do NOT mention that you are an AI

The ## Contexto ENEM section below contains real ENEM questions on this topic. Use them to calibrate the concepts, vocabulary, and cognitive level of your flashcards.

Cada flashcard DEVE ter no JSON:
- front: a pergunta ou frase incompleta (curta e direta)
- back: a resposta completa (clara, 2-3 frases máximo, com raciocínio)

Responda APENAS com JSON array:
[{"front":"...","back":"..."}]`;

function formatEnemContext(questions: EnemQuestion[]): string {
    if (questions.length === 0) return "";
    const items = questions.map((q, i) => {
        return `${i + 1}. [${q.exam_year}] ${q.question}\n   Resposta: ${q.answer}`;
    }).join("\n\n");
    return `\n\n## Contexto ENEM\nUse the following real ENEM questions as factual grounding for the flashcard content. Align difficulty and language to the ENEM standard.\n\n${items}`;
}

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

        // ── Freemium limit check ───────────────────────────────────────────
        const canUse = await checkCanUse("flashcard");
        if (!canUse) {
            return NextResponse.json({
                error: "USAGE_LIMIT_REACHED",
                message: "Você atingiu o limite de 3 decks por dia no plano gratuito. Faça upgrade para o Pro para flashcards ilimitados.",
            }, { status: 403 });
        }

        // Retrieve real ENEM questions as RAG context
        let enemContext = "";
        try {
            const ragQuery = `${topic} ENEM contextualizado`;
            const enemQuestions = await retrieveEnemQuestions({ query: ragQuery, matchCount: 4 });
            enemContext = formatEnemContext(enemQuestions);
        } catch (e) {
            console.error("[Flashcards Generate] RAG retrieval failed, continuing without context:", e);
        }

        const result = await generateText({
            model: openai("gpt-4o-mini"),
            system: FLASHCARDS_PROMPT(topic, cardCount) + enemContext,
            messages: [{ role: "user", content: `Gere ${cardCount} flashcards sobre: ${topic}` }],
            maxOutputTokens: cardCount * 200,
            temperature: 0.3,
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

        // Increment usage counter after successful generation
        await incrementUsage("flashcard");

        return NextResponse.json({ deckId: deck.id });
    } catch (error) {
        console.error("[Flashcards Generate] Error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}

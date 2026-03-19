import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";
import { checkCanUse, incrementUsage } from "@/app/actions/usage";

export const maxDuration = 60;

const MULTIPLE_CHOICE_PROMPT = (topic: string, questionCount: number) =>
    `Você é um professor especialista preparando questões no estilo ENEM. Gere ${questionCount} questões de múltipla escolha sobre o tema: ${topic}.

Cada questão DEVE ter:
- enunciado: texto da questão (pode incluir um pequeno texto de apoio quando relevante, como o ENEM faz)
- alternatives: objeto com chaves A, B, C, D, E e seus textos
- correct: a letra correta (A, B, C, D ou E)
- explanation: explicação detalhada de por que a resposta está certa

Varie a dificuldade: ~30% fáceis, ~50% médias, ~20% difíceis.
Responda APENAS com JSON array, sem texto fora do JSON:
[{"enunciado":"...","alternatives":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correct":"B","explanation":"..."}]`;

const TRUE_FALSE_PROMPT = (topic: string, questionCount: number) =>
    `Você é um professor especialista preparando questões de Verdadeiro ou Falso sobre o tema: ${topic}. Gere ${questionCount} afirmações.

Cada questão DEVE ter:
- enunciado: uma afirmação clara e objetiva
- correct: "V" se verdadeira ou "F" se falsa
- explanation: explicação de por que é verdadeira ou falsa

Misture: ~50% verdadeiras, ~50% falsas.
Responda APENAS com JSON array, sem texto fora do JSON:
[{"enunciado":"...","correct":"V","explanation":"..."}]`;

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { examType, topic, questionCount } = await request.json();

        if (!examType || !topic || !questionCount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!["multiple_choice", "true_false"].includes(examType)) {
            return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
        }

        // ── Freemium limit check ───────────────────────────────────────────
        const canUse = await checkCanUse("exam");
        if (!canUse) {
            return NextResponse.json({
                error: "USAGE_LIMIT_REACHED",
                message: "Você atingiu o limite de 3 provas por dia no plano gratuito. Faça upgrade para o Pro para provas ilimitadas.",
            }, { status: 403 });
        }

        const systemPrompt = examType === "multiple_choice"
            ? MULTIPLE_CHOICE_PROMPT(topic, questionCount)
            : TRUE_FALSE_PROMPT(topic, questionCount);

        const tokensPerQuestion = examType === "multiple_choice" ? 400 : 200;
        const maxTokens = questionCount * tokensPerQuestion;

        const result = await generateText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages: [{ role: "user", content: `Gere ${questionCount} questões sobre: ${topic}` }],
            maxOutputTokens: maxTokens,
            temperature: 0.7,
        });

        // Parse the JSON response
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error("[Exams Generate] Failed to parse AI response:", result.text);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        const questions = JSON.parse(jsonMatch[0]);

        // Create exam record
        const { data: exam, error: examError } = await sb
            .from("exams")
            .insert({
                user_id: user.id,
                title: `Prova: ${topic}`,
                exam_type: examType,
                topic,
                total_questions: questionCount,
            })
            .select("id")
            .single();

        if (examError || !exam) {
            console.error("[Exams Generate] Failed to create exam:", examError);
            return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
        }

        // Create question records
        const questionRecords = questions.map((q: {
            enunciado: string;
            alternatives?: { A: string; B: string; C: string; D: string; E: string };
            correct: string;
            explanation: string;
        }, index: number) => ({
            exam_id: exam.id,
            question_number: index + 1,
            question_type: examType,
            enunciado: q.enunciado,
            alternative_a: q.alternatives?.A || null,
            alternative_b: q.alternatives?.B || null,
            alternative_c: q.alternatives?.C || null,
            alternative_d: q.alternatives?.D || null,
            alternative_e: q.alternatives?.E || null,
            correct_answer: q.correct,
            explanation: q.explanation,
        }));

        const { error: questionsError } = await sb
            .from("exam_questions")
            .insert(questionRecords);

        if (questionsError) {
            console.error("[Exams Generate] Failed to create questions:", questionsError);
            // Clean up the exam record
            await sb.from("exams").delete().eq("id", exam.id);
            return NextResponse.json({ error: "Failed to save questions" }, { status: 500 });
        }

        // Increment usage counter after successful generation
        await incrementUsage("exam");

        return NextResponse.json({ examId: exam.id });
    } catch (error) {
        console.error("[Exams Generate] Error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const { examId } = await params;
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify exam belongs to user
        const { data: exam, error: examError } = await sb
            .from("exams")
            .select("*")
            .eq("id", examId)
            .single();

        if (examError || !exam || exam.user_id !== user.id) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        // Get all questions
        const { data: questions, error: questionsError } = await sb
            .from("exam_questions")
            .select("*")
            .eq("exam_id", examId)
            .order("question_number", { ascending: true });

        if (questionsError || !questions) {
            return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
        }

        // Compute results
        const correctCount = questions.filter((q: { is_correct: boolean | null }) => q.is_correct === true).length;
        const totalQuestions = questions.length;
        const scorePercentage = totalQuestions > 0
            ? Math.round((correctCount / totalQuestions) * 10000) / 100
            : 0;

        // Build wrong questions summary
        const wrongQuestions = questions
            .filter((q: { is_correct: boolean | null }) => q.is_correct === false)
            .map((q: { question_number: number; enunciado: string }) => `Q${q.question_number}: ${q.enunciado.slice(0, 100)}`)
            .join("\n");

        // Generate AI feedback
        const feedbackPrompt = `Você é um tutor educacional analisando o desempenho de um estudante em uma prova sobre ${exam.topic}.

Resultado: ${correctCount}/${totalQuestions} (${scorePercentage}%)
Questões erradas: ${wrongQuestions || "Nenhuma — acertou tudo!"}

Gere um feedback personalizado em português com:
1. Avaliação geral do desempenho (2-3 frases)
2. Pontos fortes identificados
3. Pontos fracos e o que precisa revisar
4. Recomendação prática de próximos passos de estudo

Seja motivador mas honesto. Máximo 200 palavras.`;

        const feedbackResult = await generateText({
            model: openai("gpt-4o-mini"),
            messages: [{ role: "user", content: feedbackPrompt }],
            maxOutputTokens: 500,
            temperature: 0.7,
        });

        const aiFeedback = feedbackResult.text.trim();

        // Update exam record
        const { error: updateError } = await sb
            .from("exams")
            .update({
                correct_answers: correctCount,
                score_percentage: scorePercentage,
                status: "completed",
                completed_at: new Date().toISOString(),
                ai_feedback: aiFeedback,
            })
            .eq("id", examId);

        if (updateError) {
            console.error("[Exam Finish] Failed to update exam:", updateError);
            return NextResponse.json({ error: "Failed to finalize exam" }, { status: 500 });
        }

        return NextResponse.json({
            exam: {
                ...exam,
                correct_answers: correctCount,
                score_percentage: scorePercentage,
                status: "completed",
                completed_at: new Date().toISOString(),
                ai_feedback: aiFeedback,
            },
            questions,
        });
    } catch (error) {
        console.error("[Exam Finish] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

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

        // Build detailed question-by-question context for feedback
        const questionDetails = questions.map((q: {
            question_number: number;
            enunciado: string;
            correct_answer: string;
            explanation: string | null;
            user_answer: string | null;
            is_correct: boolean | null;
        }) => {
            const status = q.is_correct ? "✓ ACERTOU" : "✗ ERROU";
            const lines = [
                `Q${q.question_number} [${status}]: ${q.enunciado.slice(0, 200)}`,
                `  Resposta do aluno: ${q.user_answer ?? "sem resposta"} | Resposta correta: ${q.correct_answer}`,
            ];
            if (q.explanation) {
                lines.push(`  Explicação: ${q.explanation}`);
            }
            return lines.join("\n");
        }).join("\n\n");

        // Generate AI feedback
        const feedbackSystemPrompt = `You are Otto, an ENEM study assistant. The student just completed a practice exam. Analyze their performance and give direct, specific feedback in Brazilian Portuguese.

You have access to:
- Each question they answered
- Whether they got it right or wrong
- The correct answer and explanation for each question

Your feedback MUST:
- Start by acknowledging their score directly ("Você acertou X de Y questões")
- Identify the 1-2 specific topics where they made mistakes (not just "revise math" — say "você errou as questões de funções quadráticas e geometria plana")
- For each wrong answer, briefly explain the key concept they missed in 1-2 sentences
- End with one concrete study recommendation tied to their specific weak points
- Be direct and encouraging, like a tutor who knows the student — not a generic chatbot
- Maximum 200 words total

Do NOT give generic advice like "continue studying" or "review the subject". Be specific to what THIS student got wrong in THIS exam.`;

        const feedbackUserPrompt = `Tema da prova: ${exam.topic}
Resultado: ${correctCount}/${totalQuestions} (${scorePercentage}%)

Detalhes questão por questão:
${questionDetails}`;

        const feedbackResult = await generateText({
            model: openai("gpt-4o-mini"),
            system: feedbackSystemPrompt,
            messages: [{ role: "user", content: feedbackUserPrompt }],
            maxOutputTokens: 500,
            temperature: 0.3,
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

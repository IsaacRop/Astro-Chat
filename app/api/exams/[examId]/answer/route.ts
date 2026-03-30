import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
    request: Request,
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
            .select("id, user_id")
            .eq("id", examId)
            .single();

        if (examError || !exam || exam.user_id !== user.id) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        const { questionId, answer } = await request.json();

        if (!questionId || !answer) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get the question and verify it belongs to this exam
        const { data: question, error: questionError } = await sb
            .from("exam_questions")
            .select("id, correct_answer, explanation")
            .eq("id", questionId)
            .eq("exam_id", examId)
            .single();

        if (questionError || !question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const isCorrect = answer === question.correct_answer;

        // Update the question with the user's answer
        const { error: updateError } = await sb
            .from("exam_questions")
            .update({
                user_answer: answer,
                is_correct: isCorrect,
            })
            .eq("id", questionId);

        if (updateError) {
            console.error("[Exam Answer] Failed to update question:", updateError);
            return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
        }

        return NextResponse.json({
            isCorrect,
            correctAnswer: question.correct_answer,
            explanation: question.explanation,
        });
    } catch (error) {
        console.error("[Exam Answer] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

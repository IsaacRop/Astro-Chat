"use server";

import { createClient } from "@/utils/supabase/server";

// ============================================
// TYPES
// ============================================

export interface Exam {
    id: string;
    title: string;
    exam_type: string;
    topic: string;
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    status: string;
    ai_feedback: string | null;
    started_at: string;
    completed_at: string | null;
    created_at: string;
}

export interface ExamQuestion {
    id: string;
    exam_id: string;
    question_number: number;
    question_type: string;
    enunciado: string;
    alternative_a: string | null;
    alternative_b: string | null;
    alternative_c: string | null;
    alternative_d: string | null;
    alternative_e: string | null;
    correct_answer: string;
    explanation: string | null;
    user_answer: string | null;
    is_correct: boolean | null;
    source: string;
    exam_year: number | null;
    created_at: string;
}

export interface ExamWithQuestions extends Exam {
    questions: ExamQuestion[];
}

// ============================================
// QUERIES
// ============================================

/**
 * List all exams for the current user, sorted by created_at desc.
 */
export async function getUserExams(): Promise<Exam[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("exams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[getUserExams] Error:", error);
        return [];
    }

    return (data || []) as Exam[];
}

/**
 * Get an exam with all its questions.
 */
export async function getExamWithQuestions(examId: string): Promise<ExamWithQuestions | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: exam, error: examError } = await sb
        .from("exams")
        .select("*")
        .eq("id", examId)
        .eq("user_id", user.id)
        .single();

    if (examError || !exam) {
        console.error("[getExamWithQuestions] Error:", examError);
        return null;
    }

    const { data: questions, error: questionsError } = await sb
        .from("exam_questions")
        .select("*")
        .eq("exam_id", examId)
        .order("question_number", { ascending: true });

    if (questionsError) {
        console.error("[getExamWithQuestions] Questions error:", questionsError);
        return null;
    }

    return {
        ...(exam as Exam),
        questions: (questions || []) as ExamQuestion[],
    };
}

// ============================================
// MUTATIONS (delegate to API routes)
// ============================================

/**
 * Generate a new exam via AI.
 */
export async function generateExam(
    examType: "multiple_choice" | "true_false",
    topic: string,
    questionCount: number
): Promise<{ examId: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/exams/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, topic, questionCount }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate exam");
    }

    return response.json();
}

/**
 * Submit an answer for a question.
 */
export async function submitAnswer(
    examId: string,
    questionId: string,
    answer: string
): Promise<{ isCorrect: boolean; correctAnswer: string; explanation: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/exams/${examId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit answer");
    }

    return response.json();
}

/**
 * Finish an exam and get AI feedback.
 */
export async function finishExam(examId: string): Promise<{ exam: Exam; questions: ExamQuestion[] }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/exams/${examId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to finish exam");
    }

    return response.json();
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
    Loader2,
    ArrowLeft,
    ArrowRight,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Plus,
    Map as MapIcon,
    FileCheck,
    Trophy,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
    getUserExams,
    getExamWithQuestions,
    type Exam,
    type ExamQuestion,
    type ExamWithQuestions,
} from "@/app/actions/exams";
import { getUserUsage } from "@/app/actions/usage";
import { toast } from "sonner";

// ============================================
// CONSTANTS
// ============================================

const QUESTION_COUNTS = [5, 10, 15, 20, 30, 45] as const;
const PROVAS_COLOR = "#C17D8A";
const PROVAS_BG = "#F5E3E7";

// ============================================
// TYPES
// ============================================

type Screen = "setup" | "exam" | "results";
type ExamType = "multiple_choice" | "true_false";

interface AnswerResult {
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
}

interface AnswerRecord extends AnswerResult {
    userAnswer: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProvasPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Screen state
    const [screen, setScreen] = useState<Screen>("setup");

    // Setup state
    const [examType, setExamType] = useState<ExamType | null>(null);
    const [topic, setTopic] = useState("");
    const [questionCount, setQuestionCount] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Exam state
    const [currentExam, setCurrentExam] = useState<ExamWithQuestions | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [answeredQuestions, setAnsweredQuestions] = useState<Map<string, AnswerRecord>>(new Map<string, AnswerRecord>());

    // Results state
    const [isFinishing, setIsFinishing] = useState(false);
    const [finalExam, setFinalExam] = useState<Exam | null>(null);
    const [finalQuestions, setFinalQuestions] = useState<ExamQuestion[]>([]);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [animatedScore, setAnimatedScore] = useState(0);

    // History state
    const [pastExams, setPastExams] = useState<Exam[]>([]);

    // Usage limits
    const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
    const [usageResetsAt, setUsageResetsAt] = useState("");
    const [isPro, setIsPro] = useState(false);

    // Refs
    const dotsRef = useRef<HTMLDivElement>(null);

    // Auth check
    useEffect(() => {
        async function init() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsAuthenticated(false);
                    router.replace("/?redirect=provas");
                    return;
                }
                setIsAuthenticated(true);
                const exams = await getUserExams();
                setPastExams(exams);
                // Fetch usage limits
                const usage = await getUserUsage("exam");
                setUsageRemaining(usage.remaining);
                setUsageResetsAt(usage.resetsAt);
                setIsPro(usage.isPro);
            } catch (error) {
                console.error("[Provas] Failed to load:", error);
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, [router]);

    // Score animation
    useEffect(() => {
        if (screen !== "results" || !finalExam) return;
        const target = finalExam.score_percentage;
        let current = 0;
        const step = Math.max(1, target / 40);
        const interval = setInterval(() => {
            current = Math.min(current + step, target);
            setAnimatedScore(Math.round(current));
            if (current >= target) clearInterval(interval);
        }, 25);
        return () => clearInterval(interval);
    }, [screen, finalExam]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleGenerate = useCallback(async () => {
        if (!examType || !topic.trim() || !questionCount) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/exams/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examType, topic: topic.trim(), questionCount }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.error === "USAGE_LIMIT_REACHED") {
                    toast.error(data.message || "Limite diário atingido.");
                    // Refresh usage
                    const usage = await getUserUsage("exam");
                    setUsageRemaining(usage.remaining);
                    setUsageResetsAt(usage.resetsAt);
                    return;
                }
                throw new Error("Failed to generate");
            }
            const { examId } = await res.json();
            const exam = await getExamWithQuestions(examId);
            if (!exam) throw new Error("Failed to load exam");
            setCurrentExam(exam);
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setAnsweredQuestions(new Map<string, AnswerRecord>());
            setScreen("exam");
            // Refresh usage after successful generation
            const usage = await getUserUsage("exam");
            setUsageRemaining(usage.remaining);
            setUsageResetsAt(usage.resetsAt);
        } catch (error) {
            console.error("[Provas] Generate failed:", error);
            toast.error("Não foi possível gerar a prova. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    }, [examType, topic, questionCount]);

    const handleConfirmAnswer = useCallback(async () => {
        if (!currentExam || !selectedAnswer) return;
        const question = currentExam.questions[currentQuestionIndex];
        setIsConfirming(true);
        try {
            const res = await fetch(`/api/exams/${currentExam.id}/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: question.id, answer: selectedAnswer }),
            });
            if (!res.ok) throw new Error("Failed to submit");
            const result: AnswerResult = await res.json();
            setAnswerResult(result);
            setAnsweredQuestions(prev => {
                const next = new Map(prev);
                next.set(question.id, { ...result, userAnswer: selectedAnswer });
                return next;
            });
        } catch (error) {
            console.error("[Provas] Answer failed:", error);
            toast.error("Erro ao enviar resposta. Tente novamente.");
        } finally {
            setIsConfirming(false);
        }
    }, [currentExam, currentQuestionIndex, selectedAnswer]);

    const handleNextQuestion = useCallback(() => {
        if (!currentExam) return;
        if (currentQuestionIndex < currentExam.questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            const nextQ = currentExam.questions[nextIndex];
            const prev = answeredQuestions.get(nextQ.id);
            if (prev) {
                setSelectedAnswer(prev.userAnswer);
                setAnswerResult({ isCorrect: prev.isCorrect, correctAnswer: prev.correctAnswer, explanation: prev.explanation });
            } else {
                setSelectedAnswer(null);
                setAnswerResult(null);
            }
        }
    }, [currentExam, currentQuestionIndex, answeredQuestions]);

    const handlePrevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            const prevIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(prevIndex);
            if (!currentExam) return;
            const prevQ = currentExam.questions[prevIndex];
            const prev = answeredQuestions.get(prevQ.id);
            if (prev) {
                setSelectedAnswer(prev.userAnswer);
                setAnswerResult({ isCorrect: prev.isCorrect, correctAnswer: prev.correctAnswer, explanation: prev.explanation });
            } else {
                setSelectedAnswer(null);
                setAnswerResult(null);
            }
        }
    }, [currentExam, currentQuestionIndex, answeredQuestions]);

    const handleJumpToQuestion = useCallback((index: number) => {
        if (!currentExam) return;
        setCurrentQuestionIndex(index);
        const q = currentExam.questions[index];
        const prev = answeredQuestions.get(q.id);
        if (prev) {
            setSelectedAnswer(prev.userAnswer);
            setAnswerResult({ isCorrect: prev.isCorrect, correctAnswer: prev.correctAnswer, explanation: prev.explanation });
        } else {
            setSelectedAnswer(null);
            setAnswerResult(null);
        }
    }, [currentExam, answeredQuestions]);

    const handleFinishExam = useCallback(async () => {
        if (!currentExam) return;
        setIsFinishing(true);
        try {
            const res = await fetch(`/api/exams/${currentExam.id}/finish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to finish");
            const data = await res.json();
            setFinalExam(data.exam);
            setFinalQuestions(data.questions);
            setScreen("results");
            // Refresh history
            const exams = await getUserExams();
            setPastExams(exams);
        } catch (error) {
            console.error("[Provas] Finish failed:", error);
            toast.error("Erro ao finalizar a prova. Tente novamente.");
        } finally {
            setIsFinishing(false);
        }
    }, [currentExam]);

    const handleViewPastExam = useCallback(async (exam: Exam) => {
        if (exam.status === "completed") {
            const full = await getExamWithQuestions(exam.id);
            if (full) {
                setFinalExam(full);
                setFinalQuestions(full.questions);
                setScreen("results");
            }
        }
    }, []);

    const handleRetakeExam = useCallback(() => {
        if (!finalExam) return;
        setExamType(finalExam.exam_type as ExamType);
        setTopic(finalExam.topic);
        setQuestionCount(finalExam.total_questions);
        setScreen("setup");
        // Auto-trigger generation after state update
        setTimeout(() => {
            const btn = document.getElementById("generate-btn");
            if (btn) btn.click();
        }, 100);
    }, [finalExam]);

    const handleNewExam = useCallback(() => {
        setExamType(null);
        setTopic("");
        setQuestionCount(null);
        setCurrentExam(null);
        setFinalExam(null);
        setFinalQuestions([]);
        setScreen("setup");
    }, []);

    // ============================================
    // LOADING / AUTH GUARD
    // ============================================

    if (isLoading || isAuthenticated === null) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 size={32} className="text-muted-foreground animate-spin" />
            </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
                {screen === "setup" && (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <SetupScreen
                            examType={examType}
                            setExamType={setExamType}
                            topic={topic}
                            setTopic={setTopic}
                            questionCount={questionCount}
                            setQuestionCount={setQuestionCount}
                            isGenerating={isGenerating}
                            onGenerate={handleGenerate}
                            pastExams={pastExams}
                            onViewExam={handleViewPastExam}
                            usageRemaining={usageRemaining}
                            usageResetsAt={usageResetsAt}
                            isPro={isPro}
                        />
                    </motion.div>
                )}

                {screen === "exam" && currentExam && (
                    <motion.div
                        key="exam"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.25 }}
                    >
                        <ExamScreen
                            exam={currentExam}
                            currentIndex={currentQuestionIndex}
                            selectedAnswer={selectedAnswer}
                            setSelectedAnswer={setSelectedAnswer}
                            answerResult={answerResult}
                            isConfirming={isConfirming}
                            answeredQuestions={answeredQuestions}
                            isFinishing={isFinishing}
                            dotsRef={dotsRef}
                            onConfirm={handleConfirmAnswer}
                            onNext={handleNextQuestion}
                            onPrev={handlePrevQuestion}
                            onJump={handleJumpToQuestion}
                            onFinish={handleFinishExam}
                            onBack={handleNewExam}
                        />
                    </motion.div>
                )}

                {screen === "results" && finalExam && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ResultsScreen
                            exam={finalExam}
                            questions={finalQuestions}
                            animatedScore={animatedScore}
                            expandedQuestion={expandedQuestion}
                            setExpandedQuestion={setExpandedQuestion}
                            onRetake={handleRetakeExam}
                            onNewExam={handleNewExam}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================
// SCREEN 1: SETUP
// ============================================

function SetupScreen({
    examType,
    setExamType,
    topic,
    setTopic,
    questionCount,
    setQuestionCount,
    isGenerating,
    onGenerate,
    pastExams,
    onViewExam,
    usageRemaining,
    usageResetsAt,
    isPro,
}: {
    examType: ExamType | null;
    setExamType: (t: ExamType) => void;
    topic: string;
    setTopic: (t: string) => void;
    questionCount: number | null;
    setQuestionCount: (n: number) => void;
    isGenerating: boolean;
    onGenerate: () => void;
    pastExams: Exam[];
    onViewExam: (e: Exam) => void;
    usageRemaining: number | null;
    usageResetsAt: string;
    isPro: boolean;
}) {
    const isFormComplete = examType !== null && topic.trim().length > 0 && questionCount !== null;
    const limitReached = !isPro && usageRemaining !== null && usageRemaining <= 0;

    return (
        <div className="p-4 md:p-8 max-w-xl mx-auto w-full space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-center space-y-2"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ backgroundColor: PROVAS_BG, color: PROVAS_COLOR }}>
                    <FileCheck size={16} />
                    Provas
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    Criar nova prova
                </h1>
                <p className="text-muted-foreground text-sm">
                    Configure sua prova e deixe a IA gerar as questões
                </p>
            </motion.div>

            {/* Tipo de questão */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
            >
                <label className="text-sm font-medium text-foreground">Tipo de questão</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={() => setExamType("multiple_choice")}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 min-h-[44px] ${
                            examType === "multiple_choice"
                                ? "border-[#C17D8A] bg-[#F5E3E7]/40 shadow-sm"
                                : "border-border-light bg-card hover:border-border hover:bg-muted/30"
                        }`}
                    >
                        <span className="text-2xl">📝</span>
                        <span className="font-medium text-foreground text-sm">Múltipla Escolha</span>
                        <span className="text-xs text-muted-foreground">5 alternativas, estilo ENEM</span>
                    </button>
                    <button
                        onClick={() => setExamType("true_false")}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 min-h-[44px] ${
                            examType === "true_false"
                                ? "border-[#6B9CC6] bg-[#E0EBF5]/40 shadow-sm"
                                : "border-border-light bg-card hover:border-border hover:bg-muted/30"
                        }`}
                    >
                        <span className="text-2xl">✅</span>
                        <span className="font-medium text-foreground text-sm">Verdadeiro ou Falso</span>
                        <span className="text-xs text-muted-foreground">Afirmações para julgar</span>
                    </button>
                </div>
            </motion.section>

            {/* Tema da prova */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-3"
            >
                <label className="text-sm font-medium text-foreground">Tema da prova</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Revolução Francesa, Cinemática..."
                    className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C17D8A]/30 focus:border-[#C17D8A]/50 transition-all"
                />
            </motion.section>

            {/* Número de questões */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
            >
                <label className="text-sm font-medium text-foreground">Número de questões</label>
                <div className="flex flex-wrap gap-2">
                    {QUESTION_COUNTS.map((n) => (
                        <button
                            key={n}
                            onClick={() => setQuestionCount(n)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] border ${
                                questionCount === n
                                    ? "bg-[#F5E3E7] border-[#C17D8A] text-[#C17D8A]"
                                    : "bg-card border-border-light text-muted-foreground hover:border-border hover:text-foreground"
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </motion.section>

            {/* Summary box */}
            <AnimatePresence>
                {isFormComplete && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-surface-alt rounded-2xl p-5 text-center">
                            <p className="text-sm text-foreground">
                                <span className="font-semibold">{questionCount} questões</span> de{" "}
                                <span className="font-semibold">
                                    {examType === "multiple_choice" ? "múltipla escolha" : "verdadeiro ou falso"}
                                </span>{" "}
                                sobre{" "}
                                <span className="font-semibold" style={{ color: PROVAS_COLOR }}>{topic.trim()}</span>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Limit reached card */}
            {limitReached && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#F2ECD8] border border-[#B89E6B] rounded-xl p-4 space-y-2"
                >
                    <p className="text-sm font-semibold text-foreground">Limite diário atingido</p>
                    <p className="text-xs text-muted-foreground">
                        Faça upgrade para o Pro para provas ilimitadas
                    </p>
                    <div className="flex items-center justify-between gap-3">
                        <a
                            href="/upgrade"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all min-h-[44px]"
                            style={{ backgroundColor: PROVAS_COLOR }}
                        >
                            Fazer upgrade
                        </a>
                        {usageResetsAt && (
                            <span className="text-xs text-muted-foreground">{usageResetsAt}</span>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Generate button / loading */}
            <AnimatePresence mode="wait">
                {isGenerating ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3 py-6"
                    >
                        <Loader2 size={32} className="animate-spin" style={{ color: PROVAS_COLOR }} />
                        <p className="text-sm text-muted-foreground text-center">
                            Gerando sua prova... Isso pode levar alguns segundos
                        </p>
                    </motion.div>
                ) : (
                    <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                        <motion.button
                            id="generate-btn"
                            onClick={onGenerate}
                            disabled={!isFormComplete || limitReached}
                            className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] shadow-sm hover:shadow-md"
                            style={{ backgroundColor: isFormComplete && !limitReached ? PROVAS_COLOR : "#a0a0a0" }}
                        >
                            ✨ Gerar Prova com IA
                        </motion.button>
                        {!isPro && usageRemaining !== null && usageRemaining > 0 && (
                            <p className="text-center text-xs text-muted-foreground">
                                Você tem {usageRemaining} {usageRemaining === 1 ? "prova restante" : "provas restantes"} hoje
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {pastExams.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center text-center py-8 space-y-3 border-t border-border"
                >
                    <div className="w-14 h-14 rounded-2xl bg-[#F5E3E7] flex items-center justify-center">
                        <FileCheck size={24} style={{ color: PROVAS_COLOR }} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhuma prova ainda</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        Crie sua primeira prova preenchendo o formulário acima. A IA irá gerar questões personalizadas!
                    </p>
                </motion.div>
            )}

            {/* Past exams */}
            {pastExams.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4 pt-4 border-t border-border"
                >
                    <h2 className="text-lg font-serif font-semibold text-foreground">Provas recentes</h2>
                    <div className="space-y-2">
                        {pastExams.map((exam) => (
                            <button
                                key={exam.id}
                                onClick={() => onViewExam(exam)}
                                className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-[#C17D8A]/30 transition-all text-left min-h-[44px] group"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {exam.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(exam.created_at).toLocaleDateString("pt-BR")} · {exam.total_questions} questões
                                    </p>
                                </div>
                                <ScoreBadge score={exam.score_percentage} status={exam.status} />
                            </button>
                        ))}
                    </div>
                </motion.section>
            )}
        </div>
    );
}

// ============================================
// SCREEN 2: EXAM
// ============================================

function ExamScreen({
    exam,
    currentIndex,
    selectedAnswer,
    setSelectedAnswer,
    answerResult,
    isConfirming,
    answeredQuestions,
    isFinishing,
    dotsRef,
    onConfirm,
    onNext,
    onPrev,
    onJump,
    onFinish,
    onBack,
}: {
    exam: ExamWithQuestions;
    currentIndex: number;
    selectedAnswer: string | null;
    setSelectedAnswer: (a: string | null) => void;
    answerResult: AnswerResult | null;
    isConfirming: boolean;
    answeredQuestions: Map<string, { isCorrect: boolean; correctAnswer: string; explanation: string; userAnswer: string }>;
    isFinishing: boolean;
    dotsRef: React.RefObject<HTMLDivElement | null>;
    onConfirm: () => void;
    onNext: () => void;
    onPrev: () => void;
    onJump: (i: number) => void;
    onFinish: () => void;
    onBack: () => void;
}) {
    const question = exam.questions[currentIndex];
    const isLastQuestion = currentIndex === exam.questions.length - 1;
    const allAnswered = answeredQuestions.size === exam.questions.length;
    const progress = (answeredQuestions.size / exam.questions.length) * 100;

    return (
        <div className="flex flex-col min-h-full">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 space-y-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2 flex-1 justify-center flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-card border border-border text-foreground">
                            Questão {currentIndex + 1} de {exam.questions.length}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: PROVAS_BG, color: PROVAS_COLOR }}>
                            {exam.topic}
                        </span>
                    </div>
                    <div className="w-[44px]" />
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: PROVAS_COLOR }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Question content */}
            <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                    >
                        {/* Question card */}
                        <div className="bg-card rounded-2xl border border-border p-5 md:p-7">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Questão {currentIndex + 1}
                            </span>
                            <p className="mt-3 text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap">
                                {question.enunciado}
                            </p>
                        </div>

                        {/* Alternatives */}
                        {question.question_type === "multiple_choice" ? (
                            <MultipleChoiceAlternatives
                                question={question}
                                selectedAnswer={selectedAnswer}
                                answerResult={answerResult}
                                onSelect={(a) => !answerResult && setSelectedAnswer(a)}
                            />
                        ) : (
                            <TrueFalseAlternatives
                                selectedAnswer={selectedAnswer}
                                answerResult={answerResult}
                                onSelect={(a) => !answerResult && setSelectedAnswer(a)}
                            />
                        )}

                        {/* Confirm button */}
                        {!answerResult && (
                            <button
                                onClick={onConfirm}
                                disabled={!selectedAnswer || isConfirming}
                                className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                                style={{ backgroundColor: PROVAS_COLOR }}
                            >
                                {isConfirming ? (
                                    <Loader2 size={18} className="animate-spin mx-auto" />
                                ) : (
                                    "Confirmar"
                                )}
                            </button>
                        )}

                        {/* Explanation */}
                        <AnimatePresence>
                            {answerResult && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`rounded-2xl p-5 border-l-4 ${
                                        answerResult.isCorrect
                                            ? "bg-green-50 border-green-500 dark:bg-green-950/30"
                                            : "bg-red-50 border-red-400 dark:bg-red-950/30"
                                    }`}>
                                        <p className={`text-sm font-semibold mb-2 ${
                                            answerResult.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                                        }`}>
                                            {answerResult.isCorrect
                                                ? "✓ Correto!"
                                                : `✕ Incorreto — resposta: ${answerResult.correctAnswer}`}
                                        </p>
                                        <div className="text-sm text-foreground/80 leading-relaxed">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({children}) => <p className="text-sm leading-relaxed text-foreground/80 mb-1">{children}</p>,
                                                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                                    ul: ({children}) => <ul className="pl-5 mb-1">{children}</ul>,
                                                    ol: ({children}) => <ol className="pl-5 mb-1 list-decimal">{children}</ol>,
                                                    li: ({children}) => <li className="text-sm leading-relaxed mb-0.5">{children}</li>,
                                                }}
                                            >
                                                {answerResult.explanation}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Next / Finish button */}
                                    <div className="mt-4">
                                        {isLastQuestion && allAnswered ? (
                                            <button
                                                onClick={onFinish}
                                                disabled={isFinishing}
                                                className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center gap-2"
                                                style={{ backgroundColor: PROVAS_COLOR }}
                                            >
                                                {isFinishing ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <Trophy size={16} />
                                                        Ver Resultado
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={onNext}
                                                className="w-full py-3 rounded-xl bg-card border border-border text-foreground text-sm font-medium hover:bg-muted transition-all min-h-[44px] flex items-center justify-center gap-1"
                                            >
                                                Próxima questão
                                                <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation arrows */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={onPrev}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
                    >
                        <ArrowLeft size={14} />
                        Anterior
                    </button>
                    {!isLastQuestion && (
                        <button
                            onClick={onNext}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
                        >
                            Próxima
                            <ArrowRight size={14} />
                        </button>
                    )}
                    {isLastQuestion && allAnswered && (
                        <button
                            onClick={onFinish}
                            disabled={isFinishing}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors min-h-[44px]"
                            style={{ backgroundColor: PROVAS_COLOR }}
                        >
                            {isFinishing ? <Loader2 size={14} className="animate-spin" /> : "Ver Resultado"}
                        </button>
                    )}
                </div>
            </div>

            {/* Question dots */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3">
                <div
                    ref={dotsRef}
                    className="flex gap-1.5 overflow-x-auto scrollbar-none justify-center flex-wrap max-w-2xl mx-auto"
                >
                    {exam.questions.map((q, i) => {
                        const answered = answeredQuestions.get(q.id);
                        const isCurrent = i === currentIndex;
                        let bg = "bg-muted text-muted-foreground";
                        let border = "border-transparent";
                        if (isCurrent) {
                            bg = "text-white";
                            border = "border-transparent";
                        } else if (answered?.isCorrect === true) {
                            bg = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
                        } else if (answered?.isCorrect === false) {
                            bg = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
                        }

                        return (
                            <button
                                key={q.id}
                                onClick={() => onJump(i)}
                                className={`w-7 h-7 rounded-lg text-[11px] font-medium border transition-all duration-150 flex items-center justify-center shrink-0 ${bg} ${border}`}
                                style={isCurrent ? { backgroundColor: PROVAS_COLOR } : undefined}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============================================
// MULTIPLE CHOICE ALTERNATIVES
// ============================================

function MultipleChoiceAlternatives({
    question,
    selectedAnswer,
    answerResult,
    onSelect,
}: {
    question: ExamQuestion;
    selectedAnswer: string | null;
    answerResult: AnswerResult | null;
    onSelect: (a: string) => void;
}) {
    const alternatives: { key: string; text: string | null }[] = [
        { key: "A", text: question.alternative_a },
        { key: "B", text: question.alternative_b },
        { key: "C", text: question.alternative_c },
        { key: "D", text: question.alternative_d },
        { key: "E", text: question.alternative_e },
    ].filter((a) => a.text);

    return (
        <div className="space-y-2">
            {alternatives.map(({ key, text }) => {
                let classes = "bg-card border-border-light text-foreground hover:bg-muted/50";

                if (answerResult) {
                    if (key === answerResult.correctAnswer) {
                        classes = "bg-green-50 border-green-500 text-green-800 dark:bg-green-950/30 dark:text-green-300";
                    } else if (key === selectedAnswer && !answerResult.isCorrect) {
                        classes = "bg-red-50 border-red-400 text-red-800 dark:bg-red-950/30 dark:text-red-300";
                    } else {
                        classes = "bg-card border-border-light text-muted-foreground opacity-60";
                    }
                } else if (key === selectedAnswer) {
                    classes = "bg-[#F5E3E7]/50 border-[#C17D8A] text-foreground";
                }

                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        disabled={!!answerResult}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 text-sm min-h-[44px] ${classes}`}
                    >
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg border border-current/20 flex items-center justify-center text-xs font-bold">
                            {key}
                        </span>
                        <span className="flex-1 leading-relaxed">{text}</span>
                        {answerResult && key === answerResult.correctAnswer && (
                            <Check size={18} className="text-green-600 flex-shrink-0" />
                        )}
                        {answerResult && key === selectedAnswer && !answerResult.isCorrect && key !== answerResult.correctAnswer && (
                            <X size={18} className="text-red-500 flex-shrink-0" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ============================================
// TRUE/FALSE ALTERNATIVES
// ============================================

function TrueFalseAlternatives({
    selectedAnswer,
    answerResult,
    onSelect,
}: {
    selectedAnswer: string | null;
    answerResult: AnswerResult | null;
    onSelect: (a: string) => void;
}) {
    const options: { key: string; label: string }[] = [
        { key: "V", label: "Verdadeiro" },
        { key: "F", label: "Falso" },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {options.map(({ key, label }) => {
                let classes = "bg-card border-border-light text-foreground hover:bg-muted/50";

                if (answerResult) {
                    if (key === answerResult.correctAnswer) {
                        classes = "bg-green-50 border-green-500 text-green-800 dark:bg-green-950/30 dark:text-green-300";
                    } else if (key === selectedAnswer && !answerResult.isCorrect) {
                        classes = "bg-red-50 border-red-400 text-red-800 dark:bg-red-950/30 dark:text-red-300";
                    } else {
                        classes = "bg-card border-border-light text-muted-foreground opacity-60";
                    }
                } else if (key === selectedAnswer) {
                    if (key === "V") {
                        classes = "bg-[#F5E3E7]/50 border-[#C17D8A] text-foreground";
                    } else {
                        classes = "bg-[#E0EBF5]/50 border-[#6B9CC6] text-foreground";
                    }
                }

                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        disabled={!!answerResult}
                        className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 min-h-[44px] ${classes}`}
                    >
                        {answerResult && key === answerResult.correctAnswer && <Check size={16} className="text-green-600" />}
                        {answerResult && key === selectedAnswer && !answerResult.isCorrect && key !== answerResult.correctAnswer && <X size={16} className="text-red-500" />}
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

// ============================================
// SCREEN 3: RESULTS
// ============================================

function ResultsScreen({
    exam,
    questions,
    animatedScore,
    expandedQuestion,
    setExpandedQuestion,
    onRetake,
    onNewExam,
}: {
    exam: Exam;
    questions: ExamQuestion[];
    animatedScore: number;
    expandedQuestion: string | null;
    setExpandedQuestion: (id: string | null) => void;
    onRetake: () => void;
    onNewExam: () => void;
}) {
    const scoreColor =
        exam.score_percentage >= 70 ? "text-green-600" :
        exam.score_percentage >= 40 ? "text-yellow-600" :
        "text-red-500";

    const scoreBorder =
        exam.score_percentage >= 70 ? "border-green-400" :
        exam.score_percentage >= 40 ? "border-yellow-400" :
        "border-red-400";

    const scoreBg =
        exam.score_percentage >= 70 ? "bg-green-50 dark:bg-green-950/20" :
        exam.score_percentage >= 40 ? "bg-yellow-50 dark:bg-yellow-950/20" :
        "bg-red-50 dark:bg-red-950/20";

    const xp = Math.round(exam.correct_answers * 10);

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
            {/* Score hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-4 py-6"
            >
                <div className={`w-[120px] h-[120px] rounded-full border-4 flex items-center justify-center ${scoreBorder} ${scoreBg}`}>
                    <span className={`text-3xl font-bold font-serif ${scoreColor}`}>
                        {animatedScore}%
                    </span>
                </div>
                <p className="text-foreground font-medium">
                    {exam.correct_answers} de {exam.total_questions} corretas
                </p>
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-semibold"
                    style={{ color: PROVAS_COLOR }}
                >
                    +{xp} XP conquistados!
                </motion.p>
            </motion.div>

            {/* AI feedback */}
            {exam.ai_feedback && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl border border-border p-5 md:p-6"
                >
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        🤖 Feedback do Otto
                    </h3>
                    <div className="text-sm leading-relaxed prose-feedback">
                        <ReactMarkdown
                            components={{
                                h1: ({children}) => <h1 className="text-lg font-bold mb-2 mt-4 text-[var(--color-text)]">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-bold mb-1.5 mt-3.5 text-[var(--color-text)]">{children}</h2>,
                                h3: ({children}) => <h3 className="text-[15px] font-semibold mb-1.5 mt-3 text-[var(--color-text)]">{children}</h3>,
                                p: ({children}) => <p className="text-sm leading-relaxed text-[var(--color-text-sec)] mb-2">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-[var(--color-text)]">{children}</strong>,
                                ul: ({children}) => <ul className="pl-5 mb-2">{children}</ul>,
                                ol: ({children}) => <ol className="pl-5 mb-2 list-decimal">{children}</ol>,
                                li: ({children}) => <li className="text-sm leading-relaxed text-[var(--color-text-sec)] mb-1">{children}</li>,
                            }}
                        >
                            {exam.ai_feedback}
                        </ReactMarkdown>
                    </div>
                </motion.div>
            )}

            {/* Question review */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
            >
                <h3 className="text-sm font-semibold text-foreground mb-3">Revisão das questões</h3>
                {questions.map((q, i) => {
                    const isExpanded = expandedQuestion === q.id;
                    const isCorrect = q.is_correct === true;
                    return (
                        <div key={q.id}>
                            <button
                                onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all min-h-[44px] ${
                                    isExpanded ? "bg-card border-border" : "bg-card/50 border-border-light hover:bg-card"
                                }`}
                                style={{ borderLeftWidth: 4, borderLeftColor: isCorrect ? "#22c55e" : "#ef4444" }}
                            >
                                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                                <span className="flex-1 text-sm text-foreground truncate">
                                    {q.enunciado.slice(0, 80)}{q.enunciado.length > 80 ? "..." : ""}
                                </span>
                                {isCorrect ? (
                                    <Check size={16} className="text-green-500 flex-shrink-0" />
                                ) : (
                                    <X size={16} className="text-red-500 flex-shrink-0" />
                                )}
                                {isExpanded ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                            </button>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-card border border-t-0 border-border rounded-b-2xl px-5 pb-5 pt-3 space-y-3 ml-4">
                                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                                {q.enunciado}
                                            </p>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <p className="text-muted-foreground">
                                                    Sua resposta: <span className={isCorrect ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                                        {q.user_answer || "—"}
                                                    </span>
                                                </p>
                                                {!isCorrect && (
                                                    <p className="text-muted-foreground">
                                                        Resposta correta: <span className="text-green-600 font-medium">{q.correct_answer}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`rounded-xl p-3 text-sm leading-relaxed ${
                                                isCorrect
                                                    ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                                                    : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                                            }`}>
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({children}) => <p className="text-sm leading-relaxed mb-1">{children}</p>,
                                                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                                        ul: ({children}) => <ul className="pl-5 mb-1">{children}</ul>,
                                                        ol: ({children}) => <ol className="pl-5 mb-1 list-decimal">{children}</ol>,
                                                        li: ({children}) => <li className="text-sm leading-relaxed mb-0.5">{children}</li>,
                                                    }}
                                                >
                                                    {q.explanation}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </motion.section>

            {/* Action buttons */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 pt-4 pb-8"
            >
                <button
                    onClick={onRetake}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all min-h-[44px]"
                >
                    <RotateCcw size={16} />
                    Refazer prova
                </button>
                <button
                    onClick={onNewExam}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium transition-all min-h-[44px]"
                    style={{ backgroundColor: PROVAS_COLOR }}
                >
                    <Plus size={16} />
                    Nova prova
                </button>
                <button
                    onClick={() => {}}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-muted-foreground text-sm font-medium hover:bg-muted hover:text-foreground transition-all min-h-[44px]"
                >
                    <MapIcon size={16} />
                    Ver no Mapa
                </button>
            </motion.div>
        </div>
    );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ScoreBadge({ score, status }: { score: number; status: string }) {
    if (status !== "completed") {
        return (
            <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-medium bg-muted text-muted-foreground border border-border">
                Em andamento
            </span>
        );
    }

    const color =
        score >= 70 ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800" :
        score >= 40 ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800" :
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800";

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${color}`}>
            {Math.round(score)}%
        </span>
    );
}

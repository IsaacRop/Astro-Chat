"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    Layers,
    Plus,
    Map as MapIcon,
    RotateCcw,
    Check,
    X,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
    getUserDecks,
    getDeckWithCards,
    type FlashcardDeck,
    type FlashcardCard,
    type DeckWithCards,
} from "@/app/actions/flashcards";
import { toast } from "sonner";

// ============================================
// CONSTANTS
// ============================================

const CARD_COUNTS = [5, 10, 15, 20] as const;
const WARM = "#B89E6B";
const WARM_BG = "#F2ECD8";

// ============================================
// TYPES
// ============================================

type Screen = "setup" | "review" | "results" | "detail";

// ============================================
// MAIN COMPONENT
// ============================================

export default function FlashcardsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Screen
    const [screen, setScreen] = useState<Screen>("setup");

    // Setup
    const [topic, setTopic] = useState("");
    const [cardCount, setCardCount] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);

    // Review
    const [currentDeck, setCurrentDeck] = useState<DeckWithCards | null>(null);
    const [reviewCards, setReviewCards] = useState<FlashcardCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

    // Results
    const [isFinishing, setIsFinishing] = useState(false);
    const [finalDeck, setFinalDeck] = useState<FlashcardDeck | null>(null);
    const [finalCards, setFinalCards] = useState<FlashcardCard[]>([]);
    const [animatedScore, setAnimatedScore] = useState(0);

    // Detail
    const [detailDeck, setDetailDeck] = useState<DeckWithCards | null>(null);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    // Auth
    useEffect(() => {
        async function init() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsAuthenticated(false);
                    router.replace("/?redirect=flashcards");
                    return;
                }
                setIsAuthenticated(true);
                const data = await getUserDecks();
                setDecks(data);
            } catch (error) {
                console.error("[Flashcards] Failed to load:", error);
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, [router]);

    // Score animation
    useEffect(() => {
        if (screen !== "results" || !finalDeck) return;
        const total = finalCards.length;
        const correct = finalCards.filter(c => c.user_knew === true).length;
        const target = total > 0 ? Math.round((correct / total) * 100) : 0;
        let current = 0;
        const step = Math.max(1, target / 40);
        const interval = setInterval(() => {
            current = Math.min(current + step, target);
            setAnimatedScore(Math.round(current));
            if (current >= target) clearInterval(interval);
        }, 25);
        return () => clearInterval(interval);
    }, [screen, finalDeck, finalCards]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleGenerate = useCallback(async () => {
        if (!topic.trim() || !cardCount) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/flashcards/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: topic.trim(), cardCount }),
            });
            if (!res.ok) throw new Error("Failed to generate");
            const { deckId } = await res.json();
            const deck = await getDeckWithCards(deckId);
            if (!deck) throw new Error("Failed to load deck");
            setCurrentDeck(deck);
            setReviewCards(deck.cards);
            setCurrentCardIndex(0);
            setIsFlipped(false);
            setScreen("review");
            // Refresh list
            const updated = await getUserDecks();
            setDecks(updated);
        } catch (error) {
            console.error("[Flashcards] Generate failed:", error);
            toast.error("Não foi possível gerar os flashcards. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    }, [topic, cardCount]);

    const handleReviewAnswer = useCallback(async (knew: boolean) => {
        if (!currentDeck || isSubmitting) return;
        const card = reviewCards[currentCardIndex];
        setIsSubmitting(true);
        try {
            await fetch(`/api/flashcards/${currentDeck.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardId: card.id, knew }),
            });

            // Update local card state
            const updatedCards = [...reviewCards];
            updatedCards[currentCardIndex] = { ...card, user_knew: knew, reviewed_at: new Date().toISOString() };
            setReviewCards(updatedCards);

            // Move to next or finish
            if (currentCardIndex < reviewCards.length - 1) {
                setSlideDirection("left");
                setIsFlipped(false);
                setTimeout(() => {
                    setCurrentCardIndex(prev => prev + 1);
                }, 50);
            } else {
                // All cards reviewed — finish
                handleFinish(updatedCards);
            }
        } catch (error) {
            console.error("[Flashcards] Review failed:", error);
            toast.error("Erro ao salvar resposta. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleFinish is stable via currentDeck ref
    }, [currentDeck, currentCardIndex, reviewCards, isSubmitting]);

    const handleFinish = useCallback(async (cards?: FlashcardCard[]) => {
        if (!currentDeck) return;
        setIsFinishing(true);
        try {
            const res = await fetch(`/api/flashcards/${currentDeck.id}/finish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to finish");
            const data = await res.json();
            setFinalDeck(data.deck);
            setFinalCards(cards || data.cards);
            setScreen("results");
            const updated = await getUserDecks();
            setDecks(updated);
        } catch (error) {
            console.error("[Flashcards] Finish failed:", error);
            toast.error("Erro ao finalizar o deck. Tente novamente.");
        } finally {
            setIsFinishing(false);
        }
    }, [currentDeck]);

    const handleReviewErrors = useCallback(() => {
        if (!currentDeck || !finalCards.length) return;
        const errorCards = finalCards.filter(c => c.user_knew === false);
        if (errorCards.length === 0) return;
        setReviewCards(errorCards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setScreen("review");
    }, [currentDeck, finalCards]);

    const handleOpenDeck = useCallback(async (deck: FlashcardDeck) => {
        const full = await getDeckWithCards(deck.id);
        if (!full) return;
        if (deck.status === "completed") {
            setDetailDeck(full);
            setExpandedCardId(null);
            setScreen("detail");
        } else {
            setCurrentDeck(full);
            setReviewCards(full.cards);
            setCurrentCardIndex(0);
            setIsFlipped(false);
            setScreen("review");
        }
    }, []);

    const handleStartReviewFromDetail = useCallback(() => {
        if (!detailDeck) return;
        setCurrentDeck(detailDeck);
        setReviewCards(detailDeck.cards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setScreen("review");
    }, [detailDeck]);

    const handleNewDeck = useCallback(() => {
        setTopic("");
        setCardCount(null);
        setCurrentDeck(null);
        setFinalDeck(null);
        setFinalCards([]);
        setDetailDeck(null);
        setScreen("setup");
    }, []);

    // ============================================
    // LOADING
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
                            topic={topic}
                            setTopic={setTopic}
                            cardCount={cardCount}
                            setCardCount={setCardCount}
                            isGenerating={isGenerating}
                            onGenerate={handleGenerate}
                            decks={decks}
                            onOpenDeck={handleOpenDeck}
                        />
                    </motion.div>
                )}

                {screen === "review" && currentDeck && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col min-h-full"
                    >
                        <ReviewScreen
                            deck={currentDeck}
                            cards={reviewCards}
                            currentIndex={currentCardIndex}
                            isFlipped={isFlipped}
                            setIsFlipped={setIsFlipped}
                            isSubmitting={isSubmitting}
                            isFinishing={isFinishing}
                            slideDirection={slideDirection}
                            onAnswer={handleReviewAnswer}
                            onBack={handleNewDeck}
                        />
                    </motion.div>
                )}

                {screen === "results" && finalDeck && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ResultsScreen
                            deck={finalDeck}
                            cards={finalCards}
                            animatedScore={animatedScore}
                            onReviewErrors={handleReviewErrors}
                            onNewDeck={handleNewDeck}
                        />
                    </motion.div>
                )}

                {screen === "detail" && detailDeck && (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <DetailScreen
                            deck={detailDeck}
                            expandedCardId={expandedCardId}
                            setExpandedCardId={setExpandedCardId}
                            onStartReview={handleStartReviewFromDetail}
                            onBack={handleNewDeck}
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
    topic,
    setTopic,
    cardCount,
    setCardCount,
    isGenerating,
    onGenerate,
    decks,
    onOpenDeck,
}: {
    topic: string;
    setTopic: (t: string) => void;
    cardCount: number | null;
    setCardCount: (n: number) => void;
    isGenerating: boolean;
    onGenerate: () => void;
    decks: FlashcardDeck[];
    onOpenDeck: (d: FlashcardDeck) => void;
}) {
    const isFormComplete = topic.trim().length > 0 && cardCount !== null;

    return (
        <div className="p-4 md:p-8 max-w-md mx-auto w-full space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-center space-y-2"
            >
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ backgroundColor: WARM_BG, color: WARM }}
                >
                    <Layers size={16} />
                    Flashcards
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    Criar flashcards
                </h1>
                <p className="text-muted-foreground text-sm">
                    Escolha o tema e a quantidade de cards
                </p>
            </motion.div>

            {/* Tema */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
            >
                <label className="text-sm font-medium text-foreground">Tema</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Genética, Era Vargas, Trigonometria..."
                    className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#B89E6B]/30 focus:border-[#B89E6B]/50 transition-all"
                />
            </motion.section>

            {/* Quantidade */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-3"
            >
                <label className="text-sm font-medium text-foreground">Quantidade de cards</label>
                <div className="flex flex-wrap gap-2">
                    {CARD_COUNTS.map((n) => (
                        <button
                            key={n}
                            onClick={() => setCardCount(n)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] border ${
                                cardCount === n
                                    ? "bg-[#F2ECD8] border-[#B89E6B] text-[#B89E6B]"
                                    : "bg-card border-border-light text-muted-foreground hover:border-border hover:text-foreground"
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </motion.section>

            {/* Generate */}
            <AnimatePresence mode="wait">
                {isGenerating ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3 py-6"
                    >
                        <Loader2 size={32} className="animate-spin" style={{ color: WARM }} />
                        <p className="text-sm text-muted-foreground text-center">
                            Gerando seus flashcards...
                        </p>
                    </motion.div>
                ) : (
                    <motion.button
                        key="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onGenerate}
                        disabled={!isFormComplete}
                        className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] shadow-sm hover:shadow-md"
                        style={{ backgroundColor: isFormComplete ? WARM : "#a0a0a0" }}
                    >
                        ✨ Gerar Flashcards
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {decks.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col items-center text-center py-8 space-y-3 border-t border-border"
                >
                    <div className="w-14 h-14 rounded-2xl bg-[#F2ECD8] flex items-center justify-center">
                        <Layers size={24} style={{ color: WARM }} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhum deck ainda</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        Crie seu primeiro deck de flashcards preenchendo o formulário acima. A IA irá gerar cards de estudo!
                    </p>
                </motion.div>
            )}

            {/* Recent decks */}
            {decks.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-4 pt-4 border-t border-border"
                >
                    <h2 className="text-lg font-serif font-semibold text-foreground">Meus Decks</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {decks.map((deck) => {
                            const accuracy = deck.cards_reviewed > 0
                                ? Math.round((deck.cards_correct / deck.cards_reviewed) * 100)
                                : null;
                            return (
                                <button
                                    key={deck.id}
                                    onClick={() => onOpenDeck(deck)}
                                    className="flex flex-col gap-2 p-4 bg-card border border-border rounded-2xl hover:border-[#B89E6B]/40 transition-all text-left min-h-[44px] group"
                                >
                                    <p className="text-sm font-medium text-foreground truncate group-hover:text-[#B89E6B] transition-colors">
                                        {deck.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{deck.card_count} cards</span>
                                        <span>·</span>
                                        <span>{new Date(deck.created_at).toLocaleDateString("pt-BR")}</span>
                                        {accuracy !== null && (
                                            <>
                                                <span>·</span>
                                                <span
                                                    className="font-semibold"
                                                    style={{ color: accuracy >= 70 ? "#22c55e" : accuracy >= 40 ? "#eab308" : "#ef4444" }}
                                                >
                                                    {accuracy}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border ${
                                            deck.status === "completed"
                                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                                                : "bg-muted text-muted-foreground border-border"
                                        }`}>
                                            {deck.status === "completed" ? "Concluído" : "Em andamento"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.section>
            )}
        </div>
    );
}

// ============================================
// SCREEN 2: REVIEW
// ============================================

function ReviewScreen({
    deck,
    cards,
    currentIndex,
    isFlipped,
    setIsFlipped,
    isSubmitting,
    isFinishing,
    slideDirection,
    onAnswer,
    onBack,
}: {
    deck: DeckWithCards;
    cards: FlashcardCard[];
    currentIndex: number;
    isFlipped: boolean;
    setIsFlipped: (f: boolean) => void;
    isSubmitting: boolean;
    isFinishing: boolean;
    slideDirection: "left" | "right";
    onAnswer: (knew: boolean) => void;
    onBack: () => void;
}) {
    const card = cards[currentIndex];
    const progress = ((currentIndex + (isFlipped ? 0.5 : 0)) / cards.length) * 100;

    if (isFinishing) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                <Loader2 size={32} className="animate-spin" style={{ color: WARM }} />
                <p className="text-sm text-muted-foreground">Calculando resultados...</p>
            </div>
        );
    }

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
                            Card {currentIndex + 1} de {cards.length}
                        </span>
                        <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: WARM_BG, color: WARM }}
                        >
                            {deck.topic}
                        </span>
                    </div>
                    <div className="w-[44px]" />
                </div>
                {/* Progress */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: WARM }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Card area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-md mx-auto w-full gap-6">
                <AnimatePresence mode="wait" custom={slideDirection}>
                    <motion.div
                        key={`${card.id}-${currentIndex}`}
                        custom={slideDirection}
                        initial={{ opacity: 0, x: slideDirection === "left" ? 80 : -80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: slideDirection === "left" ? -80 : 80 }}
                        transition={{ duration: 0.25 }}
                        className="w-full"
                    >
                        <FlashcardComponent
                            card={card}
                            isFlipped={isFlipped}
                            onFlip={() => setIsFlipped(!isFlipped)}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Answer buttons */}
                <AnimatePresence>
                    {isFlipped && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full grid grid-cols-2 gap-3"
                        >
                            <button
                                onClick={() => onAnswer(false)}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[56px] bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-600 dark:hover:text-white"
                            >
                                <X size={18} strokeWidth={2.5} />
                                Não sei
                            </button>
                            <button
                                onClick={() => onAnswer(true)}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[56px] bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-600 dark:hover:text-white"
                            >
                                <Check size={18} strokeWidth={2.5} />
                                Sei!
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ============================================
// FLASHCARD COMPONENT (3D flip)
// ============================================

function FlashcardComponent({
    card,
    isFlipped,
    onFlip,
}: {
    card: FlashcardCard;
    isFlipped: boolean;
    onFlip: () => void;
}) {
    return (
        <div
            className="relative w-full cursor-pointer"
            style={{ perspective: "1000px" }}
            onClick={onFlip}
        >
            <motion.div
                className="relative w-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
                {/* Front */}
                <div
                    className="w-full min-h-[220px] md:min-h-[260px] rounded-2xl border-2 border-border-light bg-card shadow-lg flex flex-col items-center justify-center p-6 md:p-8"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    <span className="absolute top-4 left-5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                        Frente
                    </span>
                    <p className="text-lg md:text-[19px] font-semibold text-foreground text-center leading-relaxed">
                        {card.front}
                    </p>
                    <span className="absolute bottom-4 text-[11px] text-muted-foreground">
                        Toque para virar
                    </span>
                </div>

                {/* Back */}
                <div
                    className="w-full min-h-[220px] md:min-h-[260px] rounded-2xl border-2 bg-surface-alt shadow-lg flex flex-col items-center justify-center p-6 md:p-8 absolute top-0 left-0"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderColor: WARM,
                    }}
                >
                    <span
                        className="absolute top-4 left-5 text-[10px] uppercase tracking-widest font-semibold"
                        style={{ color: WARM }}
                    >
                        Verso
                    </span>
                    <p className="text-[15px] text-foreground text-center leading-relaxed whitespace-pre-wrap">
                        {card.back}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// ============================================
// SCREEN 3: RESULTS
// ============================================

function ResultsScreen({
    deck,
    cards,
    animatedScore,
    onReviewErrors,
    onNewDeck,
}: {
    deck: FlashcardDeck;
    cards: FlashcardCard[];
    animatedScore: number;
    onReviewErrors: () => void;
    onNewDeck: () => void;
}) {
    const total = cards.length;
    const correct = cards.filter(c => c.user_knew === true).length;
    const knewCards = cards.filter(c => c.user_knew === true);
    const didntKnowCards = cards.filter(c => c.user_knew === false);
    const hasErrors = didntKnowCards.length > 0;
    const xp = correct * 8;

    const scoreColor =
        animatedScore >= 70 ? "text-green-600" :
        animatedScore >= 40 ? "text-yellow-600" :
        "text-red-500";
    const scoreBorder =
        animatedScore >= 70 ? "border-green-400" :
        animatedScore >= 40 ? "border-yellow-400" :
        "border-red-400";
    const scoreBg =
        animatedScore >= 70 ? "bg-green-50 dark:bg-green-950/20" :
        animatedScore >= 40 ? "bg-yellow-50 dark:bg-yellow-950/20" :
        "bg-red-50 dark:bg-red-950/20";

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
            {/* Score hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-4 py-6"
            >
                <h2 className="text-2xl font-serif font-bold text-foreground">Deck concluído!</h2>
                <div className={`w-[120px] h-[120px] rounded-full border-4 flex flex-col items-center justify-center ${scoreBorder} ${scoreBg}`}>
                    <span className={`text-3xl font-bold font-serif ${scoreColor}`}>
                        {animatedScore}%
                    </span>
                </div>
                <p className="text-foreground font-medium">
                    {correct} de {total} cards
                </p>
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-semibold"
                    style={{ color: WARM }}
                >
                    +{xp} XP
                </motion.p>
            </motion.div>

            {/* AI feedback */}
            {deck.ai_feedback && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl border border-border p-5 md:p-6"
                >
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        🤖 Feedback do Otto
                    </h3>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {deck.ai_feedback}
                    </p>
                </motion.div>
            )}

            {/* Conceitos dominados */}
            {knewCards.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                >
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Check size={14} className="text-green-500" />
                        Conceitos dominados
                    </h3>
                    <div className="space-y-1.5">
                        {knewCards.map((c) => (
                            <div
                                key={c.id}
                                className="p-3 rounded-xl bg-card border border-border text-sm text-foreground"
                                style={{ borderLeftWidth: 4, borderLeftColor: "#22c55e" }}
                            >
                                {c.front}
                            </div>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Precisa revisar */}
            {didntKnowCards.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-2"
                >
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <X size={14} className="text-red-500" />
                        Precisa revisar
                    </h3>
                    <div className="space-y-1.5">
                        {didntKnowCards.map((c) => (
                            <div
                                key={c.id}
                                className="p-3 rounded-xl bg-card border border-border text-sm space-y-1"
                                style={{ borderLeftWidth: 4, borderLeftColor: "#ef4444" }}
                            >
                                <p className="font-medium text-foreground">{c.front}</p>
                                <p className="text-muted-foreground text-xs leading-relaxed">{c.back}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Action buttons */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 pt-4 pb-8"
            >
                {hasErrors && (
                    <button
                        onClick={onReviewErrors}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all min-h-[44px] dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                    >
                        <RotateCcw size={16} />
                        Revisar erros
                    </button>
                )}
                <button
                    onClick={onNewDeck}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all min-h-[44px]"
                    style={{ backgroundColor: WARM }}
                >
                    <Plus size={16} />
                    Novo deck
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
// SCREEN 4: DECK DETAIL
// ============================================

function DetailScreen({
    deck,
    expandedCardId,
    setExpandedCardId,
    onStartReview,
    onBack,
}: {
    deck: DeckWithCards;
    expandedCardId: string | null;
    setExpandedCardId: (id: string | null) => void;
    onStartReview: () => void;
    onBack: () => void;
}) {
    const reviewed = deck.cards.filter(c => c.user_knew !== null).length;
    const correct = deck.cards.filter(c => c.user_knew === true).length;
    const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : null;

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-serif font-bold text-foreground truncate">{deck.title}</h1>
                    <p className="text-xs text-muted-foreground">{deck.topic}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold font-serif text-foreground">{deck.card_count}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold font-serif text-foreground">{reviewed}</p>
                    <p className="text-xs text-muted-foreground mt-1">Revisados</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4 text-center">
                    <p
                        className="text-2xl font-bold font-serif"
                        style={{ color: accuracy !== null ? (accuracy >= 70 ? "#22c55e" : accuracy >= 40 ? "#eab308" : "#ef4444") : "inherit" }}
                    >
                        {accuracy !== null ? `${accuracy}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Acertos</p>
                </div>
            </div>

            {/* Review button */}
            <button
                onClick={onStartReview}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all min-h-[44px] shadow-sm hover:shadow-md"
                style={{ backgroundColor: WARM }}
            >
                <RotateCcw size={16} />
                Revisar novamente
            </button>

            {/* Cards list */}
            <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Todos os cards</h3>
                {deck.cards.map((card) => {
                    const isExpanded = expandedCardId === card.id;
                    return (
                        <div key={card.id}>
                            <button
                                onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all min-h-[44px] ${
                                    isExpanded ? "bg-card border-border" : "bg-card/50 border-border-light hover:bg-card"
                                }`}
                            >
                                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{card.card_number}</span>
                                <span className="flex-1 text-sm text-foreground">{card.front}</span>
                                {card.user_knew === true && <Check size={14} className="text-green-500 flex-shrink-0" />}
                                {card.user_knew === false && <X size={14} className="text-red-500 flex-shrink-0" />}
                                {isExpanded
                                    ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" />
                                    : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
                                }
                            </button>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-surface-alt border border-t-0 border-border rounded-b-2xl px-5 pb-4 pt-3 ml-4">
                                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                                {card.back}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </section>
        </div>
    );
}

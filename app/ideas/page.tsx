"use client";

import { Header } from "@/components/Header";
import { Lightbulb, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
    getIdeas,
    createIdea,
    deleteIdea as deleteIdeaAction,
    type Idea,
    type IdeaStatus,
} from "@/app/actions/productivity";

// ============================================
// STATUS CONFIG
// ============================================

const statusLabels: Record<IdeaStatus, string> = {
    new: "Novo",
    exploring: "Explorando",
    implemented: "Implementado",
};

// ============================================
// COMPONENT
// ============================================

export default function IdeasPage() {
    const router = useRouter();
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newIdea, setNewIdea] = useState({ title: "", description: "" });

    // Check auth and load ideas on mount
    useEffect(() => {
        async function checkAuthAndLoadIdeas() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsAuthenticated(false);
                    router.replace("/?redirect=ideas");
                    return;
                }

                setIsAuthenticated(true);
                const data = await getIdeas();
                setIdeas(data);
            } catch (error) {
                console.error("[Ideas] Failed to load:", error);
            } finally {
                setIsLoading(false);
            }
        }
        checkAuthAndLoadIdeas();
    }, [router]);

    // Add new idea
    const handleAddIdea = useCallback(() => {
        if (!newIdea.title.trim()) return;

        startTransition(async () => {
            try {
                await createIdea(
                    newIdea.description.trim() || newIdea.title.trim(),
                    newIdea.title.trim(),
                    "new"
                );

                // Reload ideas
                const data = await getIdeas();
                setIdeas(data);

                setNewIdea({ title: "", description: "" });
                setShowAddForm(false);
            } catch (error) {
                console.error("[Ideas] Create failed:", error);
            }
        });
    }, [newIdea]);

    // Delete idea
    const handleDeleteIdea = useCallback((id: string) => {
        // Optimistic update
        setIdeas((prev) => prev.filter((idea) => idea.id !== id));

        startTransition(async () => {
            try {
                await deleteIdeaAction(id);
            } catch (error) {
                console.error("[Ideas] Delete failed:", error);
                // Revert on error
                const data = await getIdeas();
                setIdeas(data);
            }
        });
    }, []);

    // Loading state
    if (isLoading || isAuthenticated === null) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col">
                <Header title="Ideias" />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={32} className="text-zinc-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col overflow-x-hidden">
            <Header title="Ideias" />

            <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
                {/* Add Idea Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-all shadow-sm ring-1 ring-white/10 disabled:opacity-50"
                    >
                        <Sparkles size={18} strokeWidth={1.5} />
                        <span className="hidden sm:inline">Nova Ideia</span>
                        <span className="sm:hidden">Adicionar</span>
                    </button>
                </div>

                {/* Add Idea Form */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-5 space-y-4 shadow-xl">
                                <input
                                    type="text"
                                    value={newIdea.title}
                                    onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && newIdea.title.trim()) handleAddIdea();
                                        if (e.key === "Escape") setShowAddForm(false);
                                    }}
                                    placeholder="Qual é a sua ideia?"
                                    className="w-full px-4 py-3 bg-[#0C0C0D] border border-white/[0.05] rounded-xl text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-white/[0.2] transition-colors"
                                    autoFocus
                                />
                                <textarea
                                    value={newIdea.description}
                                    onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                                    placeholder="Descreva sua ideia... (opcional)"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#0C0C0D] border border-white/[0.05] rounded-xl text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-white/[0.2] transition-colors resize-none font-sans"
                                />
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleAddIdea}
                                        disabled={isPending || !newIdea.title.trim()}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-colors border border-transparent disabled:opacity-50"
                                    >
                                        {isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Salvar Ideia"}
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2.5 rounded-xl border border-white/[0.05] text-zinc-400 text-sm hover:bg-white/[0.05] hover:text-zinc-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {ideas.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center px-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#1A1A1C] border border-white/[0.05] flex items-center justify-center mb-6">
                            <Lightbulb size={32} className="md:w-10 md:h-10 text-zinc-500" strokeWidth={1.2} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif font-medium text-zinc-200 mb-3">Nenhuma ideia ainda</h2>
                        <p className="text-zinc-500 max-w-sm text-sm md:text-base font-sans leading-relaxed">
                            Capture suas ideias brilhantes antes que elas escapem!
                        </p>
                    </div>
                )}

                {/* Ideas Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {ideas.map((idea) => (
                        <motion.div
                            key={idea.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-5 md:p-6 hover:border-white/[0.1] transition-all group relative flex flex-col h-full"
                        >
                            {/* Color accent */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 rounded-t-2xl opacity-50"
                                style={{
                                    backgroundColor:
                                        idea.status === 'new' ? '#eab308' :
                                            idea.status === 'exploring' ? '#a855f7' : '#22c55e'
                                }}
                            />

                            <div className="flex items-start justify-between mb-4 pt-2">
                                <div className="p-2 rounded-xl bg-white/[0.03] text-zinc-400 group-hover:text-zinc-200 transition-colors border border-white/[0.02]">
                                    <Lightbulb size={18} strokeWidth={1.5} />
                                </div>
                                <button
                                    onClick={() => handleDeleteIdea(idea.id)}
                                    disabled={isPending}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all disabled:opacity-50"
                                >
                                    <Trash2 size={16} strokeWidth={1.5} />
                                </button>
                            </div>

                            <h3 className="font-serif font-medium text-lg md:text-xl text-zinc-100 mb-2 leading-tight">
                                {idea.title || idea.content?.slice(0, 50)}
                            </h3>

                            {idea.content && (
                                <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-3 font-sans flex-1">
                                    {idea.content}
                                </p>
                            )}

                            {/* Status Badge */}
                            <div className="flex gap-1.5 flex-wrap mt-auto pt-2">
                                <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-medium border ${idea.status === 'new' ? "bg-zinc-800 text-zinc-300 border-zinc-700" :
                                        idea.status === 'exploring' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        }`}
                                >
                                    {statusLabels[idea.status as IdeaStatus] || idea.status}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}

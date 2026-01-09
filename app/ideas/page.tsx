"use client";

import { Header } from "@/components/Header";
import { Lightbulb, Plus, Trash2, Sparkles } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// TYPES & STORAGE
// ============================================

interface Idea {
    id: string;
    title: string;
    description: string;
    status: "new" | "exploring" | "implemented";
    color: "purple" | "yellow" | "blue" | "green";
    createdAt: number;
}

const IDEAS_STORAGE_KEY = "astro-ideas";

function generateIdeaId(): string {
    return `idea-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadIdeas(): Idea[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(IDEAS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveIdeas(ideas: Idea[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
}

const statusLabels = {
    new: "New",
    exploring: "Exploring",
    implemented: "Implemented",
};

const statusColors = {
    new: "accent-yellow",
    exploring: "accent-purple",
    implemented: "accent-green",
};

// ============================================
// COMPONENT
// ============================================

export default function IdeasPage() {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newIdea, setNewIdea] = useState({ title: "", description: "" });

    // Load ideas on mount
    useEffect(() => {
        setIsClient(true);
        setIdeas(loadIdeas());
    }, []);

    // Persist ideas
    useEffect(() => {
        if (isClient) {
            saveIdeas(ideas);
        }
    }, [ideas, isClient]);

    // Add new idea
    const handleAddIdea = useCallback(() => {
        if (!newIdea.title.trim()) return;

        const colors: Idea["color"][] = ["purple", "yellow", "blue", "green"];
        const idea: Idea = {
            id: generateIdeaId(),
            title: newIdea.title.trim(),
            description: newIdea.description.trim(),
            status: "new",
            color: colors[Math.floor(Math.random() * colors.length)],
            createdAt: Date.now(),
        };

        setIdeas((prev) => [idea, ...prev]);
        setNewIdea({ title: "", description: "" });
        setShowAddForm(false);
    }, [newIdea]);

    // Update idea status
    const updateStatus = useCallback((id: string, status: Idea["status"]) => {
        setIdeas((prev) =>
            prev.map((idea) => (idea.id === id ? { ...idea, status } : idea))
        );
    }, []);

    // Delete idea
    const deleteIdea = useCallback((id: string) => {
        setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    }, []);

    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col overflow-x-hidden">
            <Header title="Ideias" />

            <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
                {/* Add Idea Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-all shadow-sm ring-1 ring-white/10"
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
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-colors border border-transparent"
                                    >
                                        Salvar Ideia
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
                {isClient && ideas.length === 0 && (
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
                                        idea.color === 'purple' ? '#a855f7' :
                                            idea.color === 'yellow' ? '#eab308' :
                                                idea.color === 'blue' ? '#3b82f6' : '#22c55e'
                                }}
                            />

                            <div className="flex items-start justify-between mb-4 pt-2">
                                <div className="p-2 rounded-xl bg-white/[0.03] text-zinc-400 group-hover:text-zinc-200 transition-colors border border-white/[0.02]">
                                    <Lightbulb size={18} strokeWidth={1.5} />
                                </div>
                                <button
                                    onClick={() => deleteIdea(idea.id)}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={16} strokeWidth={1.5} />
                                </button>
                            </div>

                            <h3 className="font-serif font-medium text-lg md:text-xl text-zinc-100 mb-2 leading-tight">
                                {idea.title}
                            </h3>

                            {idea.description && (
                                <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-3 font-sans flex-1">
                                    {idea.description}
                                </p>
                            )}

                            {/* Status Selector */}
                            <div className="flex gap-1.5 flex-wrap mt-auto pt-2">
                                {(Object.keys(statusLabels) as Idea["status"][]).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(idea.id, status)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-medium transition-colors border ${idea.status === status
                                            ? status === 'new' ? "bg-zinc-800 text-zinc-300 border-zinc-700" :
                                                status === 'exploring' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : "bg-transparent text-zinc-600 border-transparent hover:bg-white/[0.02] hover:text-zinc-500"
                                            }`}
                                    >
                                        {status === 'new' ? 'Novo' : status === 'exploring' ? 'Explorando' : 'Implementado'}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}

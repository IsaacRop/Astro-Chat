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
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Ideas" />

            <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4 md:space-y-6">
                {/* Add Idea Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg bg-accent-purple/90 text-background text-sm font-bold hover:bg-accent-purple transition-all shadow-sm"
                    >
                        <Sparkles size={18} />
                        <span className="hidden sm:inline">New Idea</span>
                        <span className="sm:hidden">Add</span>
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
                            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                <input
                                    type="text"
                                    value={newIdea.title}
                                    onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                                    placeholder="What's your idea?"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-purple/50"
                                    autoFocus
                                />
                                <textarea
                                    value={newIdea.description}
                                    onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                                    placeholder="Describe your idea... (optional)"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-purple/50 resize-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddIdea}
                                        className="flex-1 px-3 py-2 rounded-lg bg-accent-purple/90 text-background text-sm font-medium hover:bg-accent-purple transition-colors"
                                    >
                                        Save Idea
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-3 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {isClient && ideas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent-purple/10 flex items-center justify-center mb-4">
                            <Lightbulb size={32} className="md:w-10 md:h-10 text-accent-purple" />
                        </div>
                        <h2 className="text-lg md:text-xl font-serif font-bold mb-2">No Ideas Yet</h2>
                        <p className="text-muted-foreground max-w-sm text-sm md:text-base">
                            Capture your brilliant ideas before they slip away!
                        </p>
                    </div>
                )}

                {/* Ideas Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ideas.map((idea) => (
                        <motion.div
                            key={idea.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-accent-purple/50 transition-all group relative"
                        >
                            {/* Color accent */}
                            <div
                                className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
                                style={{ backgroundColor: `var(--accent-${idea.color})` }}
                            />

                            <div className="flex items-start justify-between mb-3 pt-2">
                                <div className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple">
                                    <Lightbulb size={18} />
                                </div>
                                <button
                                    onClick={() => deleteIdea(idea.id)}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <h3 className="font-serif font-bold text-base mb-2 text-foreground">
                                {idea.title}
                            </h3>

                            {idea.description && (
                                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                    {idea.description}
                                </p>
                            )}

                            {/* Status Selector */}
                            <div className="flex gap-1 flex-wrap">
                                {(Object.keys(statusLabels) as Idea["status"][]).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(idea.id, status)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${idea.status === status
                                            ? `bg-${statusColors[status]}/20 text-${statusColors[status]}`
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            }`}
                                        style={idea.status === status ? {
                                            backgroundColor: `var(--${statusColors[status]})20`,
                                            color: `var(--${statusColors[status]})`
                                        } : {}}
                                    >
                                        {statusLabels[status]}
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

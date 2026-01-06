"use client";

import { Header } from "@/components/Header";
import { Star, Plus, Trash2, ExternalLink, Link as LinkIcon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ============================================
// TYPES & STORAGE
// ============================================

interface Favorite {
    id: string;
    title: string;
    url?: string;
    category: "chat" | "note" | "link" | "other";
    color: "yellow" | "orange" | "purple" | "blue";
    createdAt: number;
}

const FAVORITES_STORAGE_KEY = "astro-favorites";

function generateFavoriteId(): string {
    return `fav-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadFavorites(): Favorite[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveFavorites(favorites: Favorite[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

const categoryLabels = {
    chat: "Chat",
    note: "Note",
    link: "Link",
    other: "Other",
};

const categoryIcons = {
    chat: "💬",
    note: "📝",
    link: "🔗",
    other: "⭐",
};

// ============================================
// COMPONENT
// ============================================

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFavorite, setNewFavorite] = useState({ title: "", url: "", category: "other" as Favorite["category"] });

    // Load favorites on mount
    useEffect(() => {
        setIsClient(true);
        setFavorites(loadFavorites());
    }, []);

    // Persist favorites
    useEffect(() => {
        if (isClient) {
            saveFavorites(favorites);
        }
    }, [favorites, isClient]);

    // Add new favorite
    const handleAddFavorite = useCallback(() => {
        if (!newFavorite.title.trim()) return;

        const colors: Favorite["color"][] = ["yellow", "orange", "purple", "blue"];
        const favorite: Favorite = {
            id: generateFavoriteId(),
            title: newFavorite.title.trim(),
            url: newFavorite.url.trim() || undefined,
            category: newFavorite.category,
            color: colors[Math.floor(Math.random() * colors.length)],
            createdAt: Date.now(),
        };

        setFavorites((prev) => [favorite, ...prev]);
        setNewFavorite({ title: "", url: "", category: "other" });
        setShowAddForm(false);
    }, [newFavorite]);

    // Delete favorite
    const deleteFavorite = useCallback((id: string) => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
    }, []);

    // Group by category
    const groupedFavorites = favorites.reduce((acc, fav) => {
        if (!acc[fav.category]) acc[fav.category] = [];
        acc[fav.category].push(fav);
        return acc;
    }, {} as Record<string, Favorite[]>);

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Favorites" />

            <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4 md:space-y-6">
                {/* Add Favorite Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg bg-accent-yellow/90 text-background text-sm font-bold hover:bg-accent-yellow transition-all shadow-sm"
                    >
                        <Star size={18} />
                        <span className="hidden sm:inline">Add Favorite</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Add Favorite Form */}
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
                                    value={newFavorite.title}
                                    onChange={(e) => setNewFavorite({ ...newFavorite, title: e.target.value })}
                                    placeholder="Favorite title..."
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow/50"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="url"
                                            value={newFavorite.url}
                                            onChange={(e) => setNewFavorite({ ...newFavorite, url: e.target.value })}
                                            placeholder="URL (optional)"
                                            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow/50"
                                        />
                                    </div>
                                    <select
                                        value={newFavorite.category}
                                        onChange={(e) => setNewFavorite({ ...newFavorite, category: e.target.value as Favorite["category"] })}
                                        className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow/50"
                                    >
                                        {Object.entries(categoryLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddFavorite}
                                        className="flex-1 px-3 py-2 rounded-lg bg-accent-yellow/90 text-background text-sm font-medium hover:bg-accent-yellow transition-colors"
                                    >
                                        Add Favorite
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
                {isClient && favorites.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent-yellow/10 flex items-center justify-center mb-4">
                            <Star size={32} className="md:w-10 md:h-10 text-accent-yellow" />
                        </div>
                        <h2 className="text-lg md:text-xl font-serif font-bold mb-2">No Favorites</h2>
                        <p className="text-muted-foreground max-w-sm text-sm md:text-base">
                            Save your favorite conversations, notes, and links here.
                        </p>
                    </div>
                )}

                {/* Favorites by Category */}
                <div className="space-y-6">
                    {Object.entries(groupedFavorites).map(([category, categoryFavorites]) => (
                        <div key={category}>
                            <h3 className="text-sm md:text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span>{categoryIcons[category as Favorite["category"]]}</span>
                                {categoryLabels[category as Favorite["category"]]}
                                <span className="text-muted-foreground font-normal">({categoryFavorites.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {categoryFavorites.map((favorite) => (
                                    <motion.div
                                        key={favorite.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg group hover:border-accent-yellow/50 transition-colors"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                            style={{ backgroundColor: `var(--accent-${favorite.color})20` }}
                                        >
                                            {categoryIcons[favorite.category]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground font-medium text-sm truncate">{favorite.title}</p>
                                            {favorite.url && (
                                                <p className="text-muted-foreground text-xs truncate">{favorite.url}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {favorite.url && (
                                                <Link
                                                    href={favorite.url}
                                                    target="_blank"
                                                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent-blue/10 text-muted-foreground hover:text-accent-blue transition-all"
                                                >
                                                    <ExternalLink size={14} />
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => deleteFavorite(favorite.id)}
                                                className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

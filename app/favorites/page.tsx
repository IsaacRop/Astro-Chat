"use client";

import { Header } from "@/components/Header";
import { Star, Trash2, ExternalLink, Link as LinkIcon, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
    getBookmarks,
    createBookmark,
    deleteBookmark as deleteBookmarkAction,
    type Bookmark,
    type BookmarkCategory,
} from "@/app/actions/productivity";

// ============================================
// CATEGORY CONFIG
// ============================================

const categoryLabels: Record<BookmarkCategory, string> = {
    chat: "Chat",
    note: "Note",
    link: "Link",
    other: "Other",
};

const categoryIcons: Record<BookmarkCategory, string> = {
    chat: "💬",
    note: "📝",
    link: "🔗",
    other: "⭐",
};

// ============================================
// COMPONENT
// ============================================

export default function FavoritesPage() {
    const router = useRouter();
    const [favorites, setFavorites] = useState<Bookmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFavorite, setNewFavorite] = useState({
        title: "",
        url: "",
        category: "other" as BookmarkCategory
    });

    // Check auth and load favorites on mount
    useEffect(() => {
        async function checkAuthAndLoadFavorites() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsAuthenticated(false);
                    router.replace("/?redirect=favorites");
                    return;
                }

                setIsAuthenticated(true);
                const data = await getBookmarks();
                setFavorites(data);
            } catch (error) {
                console.error("[Favorites] Failed to load:", error);
            } finally {
                setIsLoading(false);
            }
        }
        checkAuthAndLoadFavorites();
    }, [router]);

    // Add new favorite
    const handleAddFavorite = useCallback(() => {
        if (!newFavorite.title.trim()) return;

        startTransition(async () => {
            try {
                await createBookmark(
                    newFavorite.title.trim(),
                    newFavorite.url.trim() || undefined,
                    newFavorite.category
                );

                // Reload favorites
                const data = await getBookmarks();
                setFavorites(data);

                setNewFavorite({ title: "", url: "", category: "other" });
                setShowAddForm(false);
            } catch (error) {
                console.error("[Favorites] Create failed:", error);
            }
        });
    }, [newFavorite]);

    // Delete favorite
    const handleDeleteFavorite = useCallback((id: string) => {
        // Optimistic update
        setFavorites((prev) => prev.filter((f) => f.id !== id));

        startTransition(async () => {
            try {
                await deleteBookmarkAction(id);
            } catch (error) {
                console.error("[Favorites] Delete failed:", error);
                // Revert on error
                const data = await getBookmarks();
                setFavorites(data);
            }
        });
    }, []);

    // Group by category
    const groupedFavorites = favorites.reduce((acc, fav) => {
        const cat = fav.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(fav);
        return acc;
    }, {} as Record<string, Bookmark[]>);

    // Loading state
    if (isLoading || isAuthenticated === null) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col">
                <Header title="Favoritos" />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={32} className="text-zinc-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col overflow-x-hidden">
            <Header title="Favoritos" />

            <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
                {/* Add Favorite Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-all shadow-sm ring-1 ring-white/10 disabled:opacity-50"
                    >
                        <Star size={18} strokeWidth={1.5} />
                        <span className="hidden sm:inline">Adicionar Favorito</span>
                        <span className="sm:hidden">Adicionar</span>
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
                            <div className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-5 space-y-4 shadow-xl">
                                <input
                                    type="text"
                                    value={newFavorite.title}
                                    onChange={(e) => setNewFavorite({ ...newFavorite, title: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && newFavorite.title.trim()) handleAddFavorite();
                                        if (e.key === "Escape") setShowAddForm(false);
                                    }}
                                    placeholder="Título do favorito..."
                                    className="w-full px-4 py-3 bg-[#0C0C0D] border border-white/[0.05] rounded-xl text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-white/[0.2] transition-colors"
                                    autoFocus
                                />
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <LinkIcon size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        <input
                                            type="url"
                                            value={newFavorite.url}
                                            onChange={(e) => setNewFavorite({ ...newFavorite, url: e.target.value })}
                                            placeholder="URL (opcional)"
                                            className="w-full pl-10 pr-4 py-3 bg-[#0C0C0D] border border-white/[0.05] rounded-xl text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-white/[0.2] transition-colors"
                                        />
                                    </div>
                                    <select
                                        value={newFavorite.category}
                                        onChange={(e) => setNewFavorite({ ...newFavorite, category: e.target.value as BookmarkCategory })}
                                        className="px-4 py-3 bg-[#0C0C0D] border border-white/[0.05] rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-white/[0.2] transition-colors appearance-none min-w-[150px]"
                                    >
                                        {Object.entries(categoryLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleAddFavorite}
                                        disabled={isPending || !newFavorite.title.trim()}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
                                    >
                                        {isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Adicionar Favorito"}
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
                {favorites.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center px-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#1A1A1C] border border-white/[0.05] flex items-center justify-center mb-6">
                            <Star size={32} className="md:w-10 md:h-10 text-zinc-500" strokeWidth={1.2} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif font-medium text-zinc-200 mb-3">Sem Favoritos</h2>
                        <p className="text-zinc-500 max-w-sm text-sm md:text-base font-sans leading-relaxed">
                            Salve suas conversas, notas e links favoritos aqui.
                        </p>
                    </div>
                )}

                {/* Favorites by Category */}
                <div className="space-y-8">
                    {Object.entries(groupedFavorites).map(([category, categoryFavorites]) => (
                        <div key={category}>
                            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
                                <span className="text-lg">{categoryIcons[category as BookmarkCategory] || "⭐"}</span>
                                {categoryLabels[category as BookmarkCategory] || category}
                                <span className="text-zinc-700 font-normal">({categoryFavorites.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categoryFavorites.map((favorite) => (
                                    <motion.div
                                        key={favorite.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-4 p-4 bg-[#1A1A1C] border border-white/[0.05] rounded-xl group hover:border-white/[0.1] transition-all relative"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-white/[0.03] border border-white/[0.02]"
                                        >
                                            {categoryIcons[favorite.category] || "⭐"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-zinc-200 font-medium text-sm truncate font-serif leading-tight">{favorite.title}</p>
                                            {favorite.url && (
                                                <p className="text-zinc-600 text-xs truncate font-mono mt-0.5">{favorite.url}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {favorite.url && (
                                                <Link
                                                    href={favorite.url}
                                                    target="_blank"
                                                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-200 transition-all"
                                                >
                                                    <ExternalLink size={14} strokeWidth={1.5} />
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => handleDeleteFavorite(favorite.id)}
                                                disabled={isPending}
                                                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-all disabled:opacity-50"
                                            >
                                                <Trash2 size={14} strokeWidth={1.5} />
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

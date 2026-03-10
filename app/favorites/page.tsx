"use client";

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
            <div className="flex-1 flex items-center justify-center">
                <Loader2 size={32} className="text-[#8BA698] dark:text-neutral-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
                {/* Add Favorite Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddForm(true)}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-sm ring-1 ring-white/10 disabled:opacity-50"
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
                            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xl">
                                <input
                                    type="text"
                                    value={newFavorite.title}
                                    onChange={(e) => setNewFavorite({ ...newFavorite, title: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && newFavorite.title.trim()) handleAddFavorite();
                                        if (e.key === "Escape") setShowAddForm(false);
                                    }}
                                    placeholder="Título do favorito..."
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                    autoFocus
                                />
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <LinkIcon size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="url"
                                            value={newFavorite.url}
                                            onChange={(e) => setNewFavorite({ ...newFavorite, url: e.target.value })}
                                            placeholder="URL (opcional)"
                                            className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <select
                                        value={newFavorite.category}
                                        onChange={(e) => setNewFavorite({ ...newFavorite, category: e.target.value as BookmarkCategory })}
                                        className="w-full md:min-w-[150px] px-4 py-3 bg-muted border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
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
                                        className="flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Adicionar Favorito"}
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2.5 min-h-[44px] rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted hover:text-foreground transition-colors"
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
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card border border-border flex items-center justify-center mb-6">
                            <Star size={24} className="w-6 h-6 md:w-10 md:h-10 text-muted-foreground" strokeWidth={1.2} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-3">Sem Favoritos</h2>
                        <p className="text-muted-foreground max-w-sm text-sm md:text-base font-sans leading-relaxed">
                            Salve suas conversas, notas e links favoritos aqui.
                        </p>
                    </div>
                )}

                {/* Favorites by Category */}
                <div className="space-y-8">
                    {Object.entries(groupedFavorites).map(([category, categoryFavorites]) => (
                        <div key={category}>
                            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                <span className="text-lg">{categoryIcons[category as BookmarkCategory] || "⭐"}</span>
                                {categoryLabels[category as BookmarkCategory] || category}
                                <span className="text-muted-foreground font-normal">({categoryFavorites.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categoryFavorites.map((favorite) => (
                                    <motion.div
                                        key={favorite.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl group hover:border-primary/50 transition-all relative"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-muted border border-border"
                                        >
                                            {categoryIcons[favorite.category] || "⭐"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-foreground font-medium text-sm truncate font-serif leading-tight">{favorite.title}</p>
                                            {favorite.url && (
                                                <p className="text-muted-foreground text-xs truncate font-mono mt-0.5">{favorite.url}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {favorite.url && (
                                                <Link
                                                    href={favorite.url}
                                                    target="_blank"
                                                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                                >
                                                    <ExternalLink size={14} strokeWidth={1.5} />
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => handleDeleteFavorite(favorite.id)}
                                                disabled={isPending}
                                                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
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
        </div>
    );
}

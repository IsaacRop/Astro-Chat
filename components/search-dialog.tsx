"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MessageSquare, BookOpen, FileText, Lightbulb, Star, CheckSquare, CalendarDays, Settings, HelpCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchItem {
    id: string;
    label: string;
    href: string;
    icon: React.ElementType;
    category: string;
}

const allItems: SearchItem[] = [
    { id: "chat", label: "Chat", href: "/chat", icon: MessageSquare, category: "Páginas" },
    { id: "cadernos", label: "Cadernos", href: "/cadernos", icon: BookOpen, category: "Páginas" },
    { id: "notas", label: "Notas", href: "/notes", icon: FileText, category: "Páginas" },
    { id: "ideias", label: "Ideias", href: "/ideas", icon: Lightbulb, category: "Páginas" },
    { id: "favoritos", label: "Favoritos", href: "/favorites", icon: Star, category: "Páginas" },
    { id: "tarefas", label: "Tarefas", href: "/tasks", icon: CheckSquare, category: "Páginas" },
    { id: "calendario", label: "Calendário", href: "/calendar", icon: CalendarDays, category: "Páginas" },
    { id: "perfil", label: "Perfil", href: "/profile", icon: User, category: "Configurações" },
    { id: "settings", label: "Configurações", href: "/settings", icon: Settings, category: "Configurações" },
    { id: "ajuda", label: "Ajuda & Guias", href: "/help", icon: HelpCircle, category: "Configurações" },
];

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filtered = query.trim()
        ? allItems.filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        )
        : allItems;

    // Reset state when opened
    useEffect(() => {
        if (open) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Global ⌘K / Ctrl+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                onOpenChange(!open);
            }
            if (e.key === "Escape" && open) {
                onOpenChange(false);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onOpenChange]);

    // Arrow key navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => (i + 1) % filtered.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
        } else if (e.key === "Enter" && filtered[selectedIndex]) {
            e.preventDefault();
            router.push(filtered[selectedIndex].href);
            onOpenChange(false);
        }
    }, [filtered, selectedIndex, router, onOpenChange]);

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Group items by category
    const grouped = filtered.reduce<Record<string, SearchItem[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    // Flat index counter for keyboard navigation
    let flatIndex = -1;

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
                    onClick={() => onOpenChange(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="relative w-full max-w-lg bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                            <Search size={18} className="text-muted-foreground flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Buscar páginas, funcionalidades..."
                                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
                                autoComplete="off"
                            />
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
                                ESC
                            </kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[320px] overflow-y-auto py-2">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                    Nenhum resultado para &ldquo;{query}&rdquo;
                                </div>
                            ) : (
                                Object.entries(grouped).map(([category, items]) => (
                                    <div key={category}>
                                        <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                            {category}
                                        </div>
                                        {items.map((item) => {
                                            flatIndex++;
                                            const isSelected = flatIndex === selectedIndex;
                                            const Icon = item.icon;
                                            const currentFlatIndex = flatIndex;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        router.push(item.href);
                                                        onOpenChange(false);
                                                    }}
                                                    onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 ${
                                                        isSelected
                                                            ? "bg-primary/10 text-foreground"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                    }`}
                                                >
                                                    <Icon size={16} strokeWidth={1.5} className={isSelected ? "text-primary" : ""} />
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    {isSelected && (
                                                        <kbd className="text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded px-1 py-0.5">
                                                            ↵
                                                        </kbd>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
                            <span className="text-[10px] text-muted-foreground">
                                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>
                                    <kbd className="px-1 py-0.5 bg-muted border border-border rounded font-mono">↑↓</kbd> navegar
                                </span>
                                <span>
                                    <kbd className="px-1 py-0.5 bg-muted border border-border rounded font-mono">↵</kbd> abrir
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

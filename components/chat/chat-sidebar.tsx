"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { deleteChat } from "@/app/actions/study";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatSession {
    id: string;
    title: string | null;
    updated_at: string;
}

interface ChatSidebarProps {
    chats: ChatSession[];
    className?: string;
}

export function ChatSidebar({ chats, className }: ChatSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Local state copy that can be updated optimistically via DOM events
    const [localChats, setLocalChats] = useState<ChatSession[]>(chats);

    // Sync with server-provided props when they change (e.g. after a full navigation)
    useEffect(() => {
        setLocalChats(chats);
    }, [chats]);

    // Listen for new chats created by ChatInterface (via custom DOM event)
    useEffect(() => {
        const handler = (e: Event) => {
            const { id, title, updated_at } = (e as CustomEvent).detail;
            setLocalChats(prev => {
                // Avoid duplicates
                if (prev.some(c => c.id === id)) return prev;
                return [{ id, title, updated_at }, ...prev];
            });
        };
        window.addEventListener('chat-created', handler);
        return () => window.removeEventListener('chat-created', handler);
    }, []);

    // "New Chat" is 100% local — just navigate to the base chat page
    const handleNewChat = () => {
        router.push("/dashboard/chat");
    };

    const handleDelete = async (e: React.MouseEvent, chatId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Excluir conversa?')) return;

        // 1. Backup current state for rollback
        const previousChats = [...localChats];

        // 2. Optimistic update — remove from UI instantly
        setLocalChats(prev => prev.filter(c => c.id !== chatId));

        // 3. If deleting the active chat, navigate away immediately
        const isActive = pathname === `/dashboard/chat/${chatId}`;
        if (isActive) {
            router.push('/dashboard/chat');
        }

        try {
            // 4. Async deletion in Supabase
            await deleteChat(chatId);
        } catch (error) {
            // 5. Rollback on failure
            console.error("Failed to delete chat:", error);
            setLocalChats(previousChats);
            alert('Falha ao excluir conversa. Tente novamente.');
        }
    };

    return (
        <aside className={cn("w-64 border-r border-border bg-card flex flex-col h-full", className)}>
            {/* Header */}
            <div className="p-4 border-b border-border">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-all border border-primary/20 duration-300 group"
                >
                    <Plus size={16} strokeWidth={2} className="group-hover:text-primary/80 transition-colors" />
                    <span>Nova Conversa</span>
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {localChats.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <p className="text-muted-foreground text-xs">Nenhuma conversa recente</p>
                    </div>
                ) : (
                    localChats.map((chat) => {
                        const isActive = pathname === `/dashboard/chat/${chat.id}`;
                        return (
                            <Link
                                key={chat.id}
                                href={`/dashboard/chat/${chat.id}`}
                                className={cn(
                                    "flex flex-col gap-1 px-3 py-3 rounded-lg transition-all duration-200 group border border-transparent relative",
                                    isActive
                                        ? "bg-muted border-border"
                                        : "hover:bg-muted/50 hover:border-border/50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare
                                        size={14}
                                        className={cn(
                                            "shrink-0 transition-colors",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}
                                    />
                                    <span className={cn(
                                        "text-sm font-medium truncate flex-1 transition-colors",
                                        isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
                                    )}>
                                        {chat.title || "Nova Conversa"}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(e, chat.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                        title="Excluir conversa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <span className="text-[10px] text-muted-foreground pl-6 group-hover:text-foreground/70 transition-colors">
                                    {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true, locale: ptBR })}
                                </span>
                            </Link>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{localChats.length} conversas</span>
                </div>
            </div>
        </aside>
    );
}

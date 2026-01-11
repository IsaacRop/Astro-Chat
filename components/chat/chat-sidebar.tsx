"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { createNewChat } from "@/app/actions/dashboard";
import { deleteChat } from "@/app/actions/study";
import { useState, useTransition } from "react";
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
    const [isPending, startTransition] = useTransition();

    const handleNewChat = () => {
        startTransition(async () => {
            try {
                const { id } = await createNewChat();
                router.push(`/dashboard/chat/${id}`);
                router.refresh(); // Refresh to show new chat in list
            } catch (error) {
                console.error("Failed to create chat:", error);
            }
        });
    };

    const handleDelete = async (e: React.MouseEvent, chatId: string) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation(); // Prevent link click
        if (!confirm('Excluir conversa?')) return;

        try {
            await deleteChat(chatId);
            // If we deleted the current chat, go to main chat page
            if (pathname === `/dashboard/chat/${chatId}`) {
                router.push('/dashboard/chat');
            }
            router.refresh(); // Refresh to update the list
        } catch (error) {
            console.error("Failed to delete chat:", error);
        }
    };

    return (
        <aside className={cn("w-64 border-r border-white/[0.05] bg-[#1A1A1C] flex flex-col h-full", className)}>
            {/* Header */}
            <div className="p-4 border-b border-white/[0.05]">
                <button
                    onClick={handleNewChat}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-medium transition-all border border-indigo-500/20 duration-300 group"
                >
                    {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Plus size={16} strokeWidth={2} className="group-hover:text-white transition-colors" />
                    )}
                    <span>Nova Conversa</span>
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {chats.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <p className="text-zinc-500 text-xs">Nenhuma conversa recente</p>
                    </div>
                ) : (
                    chats.map((chat) => {
                        const isActive = pathname === `/dashboard/chat/${chat.id}`;
                        return (
                            <Link
                                key={chat.id}
                                href={`/dashboard/chat/${chat.id}`}
                                className={cn(
                                    "flex flex-col gap-1 px-3 py-3 rounded-lg transition-all duration-200 group border border-transparent relative",
                                    isActive
                                        ? "bg-white/[0.05] border-white/[0.05]"
                                        : "hover:bg-white/[0.03] hover:border-white/[0.02]"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare
                                        size={14}
                                        className={cn(
                                            "shrink-0 transition-colors",
                                            isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400"
                                        )}
                                    />
                                    <span className={cn(
                                        "text-sm font-medium truncate flex-1 transition-colors",
                                        isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-300"
                                    )}>
                                        {chat.title || "Nova Conversa"}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(e, chat.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                                        title="Excluir conversa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <span className="text-[10px] text-zinc-600 pl-6 group-hover:text-zinc-500 transition-colors">
                                    {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true, locale: ptBR })}
                                </span>
                            </Link>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.05]">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{chats.length} conversas</span>
                </div>
            </div>
        </aside>
    );
}

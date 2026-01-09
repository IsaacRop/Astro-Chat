"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Loader2 } from "lucide-react";
import { createNewChat } from "@/app/actions/dashboard";
import { Header } from "@/components/Header";

export default function ChatIndexPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleNewChat = () => {
        startTransition(async () => {
            try {
                const { id } = await createNewChat();
                router.push(`/dashboard/chat/${id}`);
            } catch (error) {
                console.error("Failed to create chat:", error);
            }
        });
    };

    return (
        <div className="flex flex-col h-full w-full">
            <Header title="Chat" />

            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 rounded-3xl bg-[#1A1A1C] border border-white/[0.05] flex items-center justify-center mb-8 shadow-2xl">
                    <MessageCircle size={40} className="text-zinc-100 placeholder-icon" />
                </div>

                <h1 className="text-2xl md:text-3xl font-serif text-white mb-3">
                    Bem-vindo ao Chat
                </h1>

                <p className="text-zinc-500 max-w-sm mb-8 text-sm md:text-base">
                    Selecione uma conversa ao lado ou inicie um novo tópico para explorar conhecimentos com o Otto.
                </p>

                <button
                    onClick={handleNewChat}
                    disabled={isPending}
                    className="flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Plus size={20} />
                    )}
                    <span>Iniciar Nova Conversa</span>
                </button>
            </div>
        </div>
    );
}

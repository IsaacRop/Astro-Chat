"use client";

import { Header } from "@/components/Header";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Star, MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { useEffect, useState } from "react";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);



    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#0C0C0D] text-foreground flex flex-col overflow-x-hidden">
            <Header title="Configurações" />

            <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8 md:space-y-12">
                {/* Theme Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-zinc-200 border-b border-white/[0.05] pb-3">Aparência</h2>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <button
                            onClick={() => setTheme("light")}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all aspect-square sm:aspect-auto sm:h-32 ${mounted && theme === "light"
                                ? "bg-zinc-100 border-zinc-200 text-zinc-900"
                                : "bg-[#1A1A1C] border-white/[0.05] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                                }`}
                        >
                            <Sun size={24} className="mb-3" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Claro</span>
                        </button>

                        <button
                            onClick={() => setTheme("dark")}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all aspect-square sm:aspect-auto sm:h-32 ${mounted && theme === "dark"
                                ? "bg-[#27272A] border-zinc-700 text-zinc-100"
                                : "bg-[#1A1A1C] border-white/[0.05] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                                }`}
                        >
                            <Moon size={24} className="mb-3" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Escuro</span>
                        </button>

                        <button
                            onClick={() => setTheme("system")}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all aspect-square sm:aspect-auto sm:h-32 ${mounted && theme === "system"
                                ? "bg-zinc-800 border-zinc-700 text-zinc-100"
                                : "bg-[#1A1A1C] border-white/[0.05] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                                }`}
                        >
                            <Monitor size={24} className="mb-3" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Sistema</span>
                        </button>
                    </div>
                </section>

                {/* About Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-zinc-200 border-b border-white/[0.05] pb-3">Sobre</h2>
                    <div className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center flex-shrink-0">
                            <Star className="w-8 h-8 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-medium text-zinc-200 mb-1">Otto AI</h3>
                            <p className="text-zinc-500 text-sm mb-4">Versão 1.0.0 (Minimalist)</p>
                            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                                Assistente de IA de próxima geração projetado para clareza, foco e simplicidade.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Feedback Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-zinc-200 border-b border-white/[0.05] pb-3">Feedback</h2>
                    <FeedbackDialog>
                        <button className="w-full bg-[#1A1A1C] border border-white/[0.05] rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left hover:border-white/[0.1] hover:bg-white/[0.02] transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.05] transition-colors">
                                <MessageSquarePlus className="w-8 h-8 text-zinc-400 group-hover:text-zinc-200 transition-colors" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif font-medium text-zinc-200 mb-1">Enviar Feedback</h3>
                                <p className="text-zinc-500 text-sm mb-4">Ajude-nos a melhorar o Otto.</p>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                                    Encontrou um bug ou tem uma ideia? Clique aqui para nos contar diretamente.
                                </p>
                            </div>
                        </button>
                    </FeedbackDialog>
                </section>
            </main>
        </div>
    );
}

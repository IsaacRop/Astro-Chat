"use client";

import { Header } from "@/components/Header";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Star, MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { AboutSection } from "@/components/settings/about-section";
import { useEffect, useState } from "react";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);



    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Configurações" />

            <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8 md:space-y-12">
                {/* Theme Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-foreground border-b border-border pb-3">Aparência</h2>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <button
                            onClick={() => setTheme("light")}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all aspect-square sm:aspect-auto sm:h-32 ${mounted && theme === "light"
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <Sun size={24} className="mb-3" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Claro</span>
                        </button>

                        <button
                            onClick={() => setTheme("dark")}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all aspect-square sm:aspect-auto sm:h-32 ${mounted && theme === "dark"
                                ? "bg-accent border-primary/30 text-foreground"
                                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <Moon size={24} className="mb-3" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Escuro</span>
                        </button>

                        <button
                            onClick={() => setTheme("system")}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all aspect-square sm:aspect-auto sm:h-32 ${mounted && theme === "system"
                                ? "bg-zinc-800 border-zinc-700 text-zinc-100"
                                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <Monitor size={24} className="mb-3" strokeWidth={1.5} />
                            <span className="font-medium text-sm">Sistema</span>
                        </button>
                    </div>
                </section>

                {/* System Guide Section */}
                <AboutSection />

                {/* About Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-foreground border-b border-border pb-3">Sobre</h2>
                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <Star className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-medium text-foreground mb-1">Otto AI</h3>
                            <p className="text-muted-foreground text-sm mb-4">Versão 1.0.0 (Minimalist)</p>
                            <p className="text-foreground/70 text-sm leading-relaxed max-w-md">
                                Assistente de IA de próxima geração projetado para clareza, foco e simplicidade.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Feedback Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-foreground border-b border-border pb-3">Feedback</h2>
                    <FeedbackDialog>
                        <button className="w-full bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left hover:border-primary/50 hover:bg-muted/50 transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                                <MessageSquarePlus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-serif font-medium text-foreground mb-1">Enviar Feedback</h3>
                                <p className="text-muted-foreground text-sm mb-4">Ajude-nos a melhorar o Otto.</p>
                                <p className="text-foreground/70 text-sm leading-relaxed max-w-md">
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

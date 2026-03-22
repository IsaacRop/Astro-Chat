"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Star, MessageSquarePlus, Crown, MessageSquare, FileCheck, Layers, Check } from "lucide-react";
import Link from "next/link";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { AboutSection } from "@/components/settings/about-section";
import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";

interface UsageData {
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
    resetAt: string | null;
    isPro: boolean;
}

interface SettingsClientProps {
    chatUsage: UsageData;
    examUsage: UsageData;
    flashcardUsage: UsageData;
}

export function SettingsClient({ chatUsage, examUsage, flashcardUsage }: SettingsClientProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Live countdown — ticks every second, isolated inside the hook
    const timeLeft = useCountdown(chatUsage.resetAt);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isPro = chatUsage.isPro;

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8 md:space-y-12">
                {/* Theme Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-foreground border-b border-border pb-3">Aparência</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
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

                {/* Seu Plano Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif font-medium text-foreground border-b border-border pb-3">Seu Plano</h2>

                    {/* Plan Card */}
                    <div className="bg-white dark:bg-card border border-[#E2EDE6] dark:border-border rounded-2xl p-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#DFF0E5] dark:bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Crown className="w-7 h-7 text-[#4A9E6B]" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center gap-3 justify-center sm:justify-start">
                                    <h3 className="text-xl font-serif font-bold text-foreground">
                                        {isPro ? "Plano Pro" : "Plano Gratuito"}
                                    </h3>
                                    {isPro && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DFF0E5] text-[#4A9E6B] dark:bg-green-900/30 dark:text-green-400">
                                            <Check size={12} />
                                            Ativo
                                        </span>
                                    )}
                                </div>
                                {!isPro && (
                                    <div className="mt-3">
                                        <Link
                                            href="/upgrade"
                                            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#4A9E6B] hover:bg-[#3B8558] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                                        >
                                            Fazer upgrade para Pro →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Usage Table (free plan only) */}
                    {!isPro && (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-base text-foreground">Limites de uso (janela de 5 horas)</h4>

                            <UsageRow
                                icon={<MessageSquare size={20} />}
                                iconBg="bg-[#DFF0E5] dark:bg-green-900/20"
                                iconColor="text-[#4A9E6B]"
                                label="Mensagens do Chat"
                                used={chatUsage.used}
                                limit={chatUsage.limit}
                            />
                            <UsageRow
                                icon={<FileCheck size={20} />}
                                iconBg="bg-[#F5E3E7] dark:bg-red-900/20"
                                iconColor="text-[#C17D8A]"
                                label="Provas com IA"
                                used={examUsage.used}
                                limit={examUsage.limit}
                            />
                            <UsageRow
                                icon={<Layers size={20} />}
                                iconBg="bg-[#F2ECD8] dark:bg-yellow-900/20"
                                iconColor="text-[#B89E6B]"
                                label="Flashcards com IA"
                                used={flashcardUsage.used}
                                limit={flashcardUsage.limit}
                            />

                            {/* Live countdown */}
                            {chatUsage.resetAt && timeLeft && (
                                <p className="text-sm text-[#8BA698]">
                                    Renova em <span className="font-medium tabular-nums">{timeLeft}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Pro plan features */}
                    {isPro && (
                        <div className="bg-white dark:bg-card border border-[#E2EDE6] dark:border-border rounded-2xl p-6 space-y-3">
                            <p className="text-sm text-[#5A7565]">
                                Você tem acesso ilimitado a todas as funcionalidades.
                            </p>
                            <div className="space-y-2">
                                {["Mensagens ilimitadas", "Provas ilimitadas", "Flashcards ilimitados"].map((feature) => (
                                    <div key={feature} className="flex items-center gap-2.5">
                                        <div className="w-5 h-5 rounded-full bg-[#DFF0E5] dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                            <Check size={12} className="text-[#4A9E6B]" />
                                        </div>
                                        <span className="text-sm text-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

// ── Usage Row Component ─────────────────────────────────────────────────────

function UsageRow({
    icon,
    iconBg,
    iconColor,
    label,
    used,
    limit,
}: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    used: number;
    limit: number;
}) {
    const ratio = limit > 0 ? used / limit : 0;
    const pct = Math.round(Math.min(ratio, 1) * 100);
    const atLimit = ratio >= 1;
    const warning = ratio >= 0.8 && !atLimit;

    const barColor = atLimit
        ? "var(--destructive, #ef4444)"
        : warning
            ? "#f59e0b"
            : "var(--primary, #4A9E6B)";

    const pctColor = atLimit
        ? "text-destructive font-bold"
        : warning
            ? "text-amber-500 font-semibold"
            : "text-[#5A7565]";

    return (
        <div className="bg-white dark:bg-card border border-[#E2EDE6] dark:border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className={`text-sm tabular-nums ${pctColor}`}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#E2EDE6] dark:bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    MessageSquare, BookOpen, FileText, Lightbulb, Star, CheckSquare,
    CalendarDays, StickyNote, ListTodo, FileCheck, Layers
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

interface Stats {
    notesCount: number;
    notesThisWeek: number;
    pendingTasks: number;
    tasksThisWeek: number;
    ideasCount: number;
    streakDays: number;
}

interface ActivityItem {
    type: string;
    title: string;
    action: string;
    time: string;
    href: string;
}

interface Props {
    userName: string;
    stats: Stats;
    recentActivity: ActivityItem[];
    latestChatId: string | null;
    autoOpenAuth?: boolean;
}

const features = [
    { id: "chat",       label: "Chat",       icon: MessageSquare, href: "/chat", desc: "Converse com o Otto",
      text: "text-primary", bg: "bg-primary/10", border: "border-primary/20", hov: "hover:border-primary/50 hover:bg-primary/20" },
    { id: "cadernos",   label: "Cadernos",   icon: BookOpen,      href: "/cadernos",       desc: "Grafo de conhecimento",
      text: "text-accent-teal", bg: "bg-accent-teal/10", border: "border-accent-teal/20", hov: "hover:border-accent-teal/50 hover:bg-accent-teal/20" },
    { id: "notas",      label: "Notas",      icon: FileText,      href: "/notes",          desc: "Editor Markdown",
      text: "text-accent-green", bg: "bg-accent-green/10", border: "border-accent-green/20", hov: "hover:border-accent-green/50 hover:bg-accent-green/20" },
    { id: "ideias",     label: "Ideias",     icon: Lightbulb,     href: "/ideas",          desc: "Capture inspirações",
      text: "text-accent-purple", bg: "bg-accent-purple/10", border: "border-accent-purple/20", hov: "hover:border-accent-purple/50 hover:bg-accent-purple/20" },
    { id: "favoritos",  label: "Favoritos",  icon: Star,          href: "/favorites",      desc: "Itens salvos",
      text: "text-accent-yellow", bg: "bg-accent-yellow/10", border: "border-accent-yellow/20", hov: "hover:border-accent-yellow/50 hover:bg-accent-yellow/20" },
    { id: "provas",     label: "Provas",     icon: FileCheck,     href: "/provas",         desc: "Simulados com IA",
      text: "text-[#C17D8A] dark:text-[#E8BDC4]", bg: "bg-[#F5E3E7] dark:bg-[#C17D8A]/20", border: "border-[#C17D8A]/20 dark:border-[#C17D8A]/30", hov: "hover:border-[#C17D8A]/50 hover:bg-[#F5E3E7] dark:hover:border-[#E8BDC4]/50 dark:hover:bg-[#C17D8A]/40" },
    { id: "flashcards", label: "Flashcards", icon: Layers,        href: "/flashcards",     desc: "Cards de estudo",
      text: "text-[#B89E6B] dark:text-[#D4C098]", bg: "bg-[#F2ECD8] dark:bg-[#B89E6B]/20", border: "border-[#B89E6B]/20 dark:border-[#B89E6B]/30", hov: "hover:border-[#B89E6B]/50 hover:bg-[#F2ECD8] dark:hover:border-[#D4C098]/50 dark:hover:bg-[#B89E6B]/40" },
    { id: "tarefas",    label: "Tarefas",    icon: CheckSquare,   href: "/tasks",          desc: "Kanban Board",
      text: "text-accent-red", bg: "bg-accent-red/10", border: "border-accent-red/20", hov: "hover:border-accent-red/50 hover:bg-accent-red/20" },
    { id: "calendario", label: "Calendário", icon: CalendarDays,  href: "/calendar",       desc: "Eventos e prazos",
      text: "text-accent-blue", bg: "bg-accent-blue/10", border: "border-accent-blue/20", hov: "hover:border-accent-blue/50 hover:bg-accent-blue/20" },
];

const item = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.32, ease: "easeOut" as const } }),
};

function StatCard({ label, value, trend, trendColor, delay }: {
    label: string; value: number | string; trend?: string; trendColor?: string; delay: number;
}) {
    return (
        <motion.div
            className="w-full bg-card border border-border rounded-2xl p-3 md:p-5 overflow-hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <p className="text-muted-foreground text-[10px] md:text-[11px] font-bold tracking-wider uppercase truncate">{label}</p>
            <div className="flex items-baseline gap-1.5 mt-1.5 md:mt-2 min-w-0">
                <span className="text-foreground text-2xl md:text-[32px] leading-none font-bold">{value}</span>
                {trend && <span className={"hidden sm:inline text-xs font-semibold whitespace-nowrap " + trendColor}>{trend}</span>}
            </div>
        </motion.div>
    );
}

/**
 * Feature card — behaves as a Link for authenticated users,
 * and as an auth trigger for guests.
 */
function FeatureCard({ f, delay }: { f: typeof features[0]; delay: number }) {
    const Icon = f.icon;
    const { requireAuth, isAuthenticated } = useAuthModal();
    const router = useRouter();

    return (
        <motion.div custom={delay} variants={item} initial="hidden" animate="visible" className="h-full">
            {isAuthenticated ? (
                // Authenticated: fast client-side navigation via Link
                <Link
                    href={f.href}
                    className="flex flex-col items-start p-4 md:p-5 bg-card border border-border rounded-2xl transition-all duration-200 group hover:-translate-y-1 hover:shadow-md h-full"
                >
                    <div className={"flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl mb-3 md:mb-4 " + f.bg}>
                        <Icon size={20} className={f.text} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-foreground font-bold text-[14px] md:text-[15px]">{f.label}</h3>
                    <p className="text-muted-foreground text-[12px] md:text-[13px] mt-1">{f.desc}</p>
                </Link>
            ) : (
                // Guest: show card normally, gate the click
                <button
                    onClick={() => requireAuth(() => router.push(f.href))}
                    className="flex flex-col items-start p-4 md:p-5 bg-card border border-border rounded-2xl transition-all duration-200 group hover:-translate-y-1 hover:shadow-md h-full w-full text-left"
                >
                    <div className={"flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl mb-3 md:mb-4 " + f.bg}>
                        <Icon size={20} className={f.text} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-foreground font-bold text-[14px] md:text-[15px]">{f.label}</h3>
                    <p className="text-muted-foreground text-[12px] md:text-[13px] mt-1">{f.desc}</p>
                </button>
            )}
        </motion.div>
    );
}

const typeIcon: Record<string, React.ReactNode> = {
    note:  <StickyNote  size={14} className="text-accent-green" />,
    task:  <ListTodo    size={14} className="text-accent-red" />,
    idea:  <Lightbulb   size={14} className="text-accent-purple" />,
    chat:  <MessageSquare size={14} className="text-primary" />,
};

function ActivityRow({ act, delay }: { act: ActivityItem; delay: number }) {
    const relTime = (() => {
        try { return formatDistanceToNow(new Date(act.time), { addSuffix: true, locale: ptBR }); }
        catch { return ""; }
    })();
    return (
        <motion.div custom={delay} variants={item} initial="hidden" animate="visible">
            <Link href={act.href} className="flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 hover:bg-accent/10 transition-colors duration-150 group w-full min-w-0">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/5 flex-shrink-0">
                    {typeIcon[act.type] ?? typeIcon.note}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{act.action}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 group-hover:text-foreground/70">{relTime}</span>
            </Link>
        </motion.div>
    );
}

/**
 * Mini chat widget on the home dashboard.
 * For guests: any interaction with the input opens the auth modal.
 * For authenticated users: submitting navigates to the full chat page.
 */
function ChatWidget({ latestChatId, userName }: { latestChatId: string | null; userName: string }) {
    const router = useRouter();

    return (
        <div className="bg-card border border-border rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 md:px-5 md:py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-bold text-[15px] text-foreground">Otto</span>
                </div>
                <span className="text-[13px] font-medium text-muted-foreground">Assistente de IA</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 p-3 md:p-5 overflow-y-auto bg-background">
                <div className="flex justify-start">
                    <div className="max-w-[85%] bg-accent/10 text-foreground text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed">
                        Olá {userName?.split(' ')[0] || 'Isaac'}! Como posso ajudar você hoje?
                    </div>
                </div>
                {latestChatId && (
                    <div className="flex justify-end mt-2">
                        <Link href={"/chat/" + latestChatId} className="max-w-[82%] bg-primary text-primary-foreground text-[13px] font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed hover:bg-primary/90 transition-colors">
                            Ver conversa anterior →
                        </Link>
                    </div>
                )}
            </div>
            <div className="p-3 md:p-4 border-t border-border bg-background">
                <button
                    onClick={() => router.push("/chat")}
                    className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-medium transition-opacity hover:opacity-90"
                >
                    Ir para o Chat →
                </button>
            </div>
        </div>
    );
}

export function DashboardHome({ userName, stats, recentActivity, latestChatId, autoOpenAuth }: Props) {
    const { openModal } = useAuthModal();
    const [greeting, setGreeting] = useState("Bom dia");

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite");
    }, []);

    // Open the login modal when arriving via a middleware-protected redirect
    useEffect(() => {
        if (autoOpenAuth) openModal();
    }, [autoOpenAuth, openModal]);

    const statCards = [
        { label: "Pendentes", value: stats.pendingTasks, trend: stats.pendingTasks > 0 ? `${stats.pendingTasks} para hoje` : "",  trendColor: "text-accent-red" },
        { label: "Sequência", value: `${stats.streakDays} dias`, trend: "Recorde!", trendColor: "text-accent-blue" },
    ];

    return (
        <main className="p-4 md:p-6 lg:p-8 min-h-full bg-background space-y-5">

            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h1 className="font-serif text-xl md:text-2xl font-bold text-foreground">
                    {greeting}, {userName}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Aqui está um resumo do seu espaço de trabalho</p>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
                {statCards.map((s, i) => (
                    <StatCard key={s.label} label={s.label} value={s.value} trend={s.trend} trendColor={s.trendColor} delay={0.1 + i * 0.07} />
                ))}
            </div>

            {/* Two columns */}
            <div className="flex flex-col lg:flex-row gap-5 mt-5 md:gap-8 md:mt-10">

                {/* Left: Chat widget */}
                <motion.div
                    className="flex flex-col w-full lg:w-[45%]"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                >
                    <h2 className="text-foreground font-bold text-[17px] mb-4">Assistente</h2>
                    <div className="flex-1 max-h-[300px] md:max-h-[500px]">
                        <ChatWidget latestChatId={latestChatId} userName={userName} />
                    </div>
                </motion.div>

                {/* Right: Feature grid */}
                <motion.div
                    className="flex flex-col w-full lg:w-[55%]"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 }}
                >
                    <h2 className="text-foreground font-bold text-[17px] mb-4">Acesso rápido</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {features.filter(f => f.id !== "chat").map((f, i) => (
                            <FeatureCard key={f.id} f={f} delay={0.28 + i * 0.06} />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent activity */}
            {recentActivity.length > 0 && (
                <motion.div
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 }}
                >
                    <div className="flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3 border-b border-border">
                        <h2 className="text-sm font-semibold text-foreground">Atividade recente</h2>
                        <span className="text-xs text-muted-foreground">{recentActivity.length} itens</span>
                    </div>
                    <div className="divide-y divide-border">
                        {recentActivity.map((act, i) => (
                            <ActivityRow key={act.href + i} act={act} delay={0.38 + i * 0.05} />
                        ))}
                    </div>
                </motion.div>
            )}

        </main>
    );
}

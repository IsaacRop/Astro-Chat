"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    MessageSquare, BookOpen, FileText, Lightbulb, Star, CheckSquare,
    CalendarDays, Network, TrendingUp, Flame, Send, StickyNote, ListTodo
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

const features = [
    { id: "chat",       label: "Chat",       icon: MessageSquare, href: "/dashboard/chat", desc: "Converse com o Otto",
      text: "text-[#4A9E6B]", bg: "bg-[#DFF0E5]", border: "border-[#4A9E6B]/20", hov: "hover:border-[#4A9E6B]/50 hover:bg-[#DFF0E5]/60" },
    { id: "cadernos",   label: "Cadernos",   icon: BookOpen,      href: "/cadernos",       desc: "Grafo de conhecimento",
      text: "text-[#5B9E9E]", bg: "bg-[#DFF0F0]", border: "border-[#5B9E9E]/20", hov: "hover:border-[#5B9E9E]/50 hover:bg-[#DFF0F0]/60" },
    { id: "notas",      label: "Notas",      icon: FileText,      href: "/notes",          desc: "Editor Markdown",
      text: "text-[#6BBF8A]", bg: "bg-[#E3F5EB]", border: "border-[#6BBF8A]/20", hov: "hover:border-[#6BBF8A]/50 hover:bg-[#E3F5EB]/60" },
    { id: "ideias",     label: "Ideias",     icon: Lightbulb,     href: "/ideas",          desc: "Capture inspirações",
      text: "text-[#9B82B8]", bg: "bg-[#EDE3F5]", border: "border-[#9B82B8]/20", hov: "hover:border-[#9B82B8]/50 hover:bg-[#EDE3F5]/60" },
    { id: "favoritos",  label: "Favoritos",  icon: Star,          href: "/favorites",      desc: "Itens salvos",
      text: "text-[#B89E6B]", bg: "bg-[#F2ECD8]", border: "border-[#B89E6B]/20", hov: "hover:border-[#B89E6B]/50 hover:bg-[#F2ECD8]/60" },
    { id: "tarefas",    label: "Tarefas",    icon: CheckSquare,   href: "/tasks",          desc: "Kanban Board",
      text: "text-[#C17D8A]", bg: "bg-[#F5E3E7]", border: "border-[#C17D8A]/20", hov: "hover:border-[#C17D8A]/50 hover:bg-[#F5E3E7]/60" },
    { id: "calendario", label: "Calendário", icon: CalendarDays,  href: "/calendar",       desc: "Eventos e prazos",
      text: "text-[#6B9CC6]", bg: "bg-[#E0EBF5]", border: "border-[#6B9CC6]/20", hov: "hover:border-[#6B9CC6]/50 hover:bg-[#E0EBF5]/60" },
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
            className="flex-1 min-w-0 bg-white border border-[#E2EDE6] rounded-2xl p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <p className="text-[#8BA698] text-[11px] font-bold tracking-wider uppercase">{label}</p>
            <div className="flex items-baseline gap-2 mt-2">
                <span className="text-[#1E2E25] text-[32px] leading-none font-bold">{value}</span>
                {trend && <span className={"text-xs font-semibold whitespace-nowrap " + trendColor}>{trend}</span>}
            </div>
        </motion.div>
    );
}

function FeatureCard({ f, delay }: { f: typeof features[0]; delay: number }) {
    const Icon = f.icon;
    return (
        <motion.div custom={delay} variants={item} initial="hidden" animate="visible">
            <Link
                href={f.href}
                className={"flex flex-col items-start p-5 bg-white border border-[#E2EDE6] rounded-2xl transition-all duration-200 group hover:-translate-y-1 hover:shadow-md h-full"}
            >
                <div className={"flex items-center justify-center w-12 h-12 rounded-xl mb-4 " + f.bg}>
                    <Icon size={22} className={f.text} strokeWidth={1.8} />
                </div>
                <h3 className="text-[#1E2E25] font-bold text-[15px]">{f.label}</h3>
                <p className="text-[#8BA698] text-[13px] mt-1">{f.desc}</p>
            </Link>
        </motion.div>
    );
}

const typeIcon: Record<string, React.ReactNode> = {
    note:  <StickyNote  size={14} className="text-[#6BBF8A]" />,
    task:  <ListTodo    size={14} className="text-[#C17D8A]" />,
    idea:  <Lightbulb   size={14} className="text-[#9B82B8]" />,
    chat:  <MessageSquare size={14} className="text-[#4A9E6B]" />,
};

function ActivityRow({ act, delay }: { act: ActivityItem; delay: number }) {
    const relTime = (() => {
        try { return formatDistanceToNow(new Date(act.time), { addSuffix: true, locale: ptBR }); }
        catch { return ""; }
    })();
    return (
        <motion.div custom={delay} variants={item} initial="hidden" animate="visible">
            <Link href={act.href} className="flex items-center gap-3 px-4 py-3 hover:bg-[#EDF4EF] transition-colors duration-150 group">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#F5F9F6] flex-shrink-0">
                    {typeIcon[act.type] ?? typeIcon.note}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E2E25] truncate">{act.title}</p>
                    <p className="text-xs text-[#8BA698]">{act.action}</p>
                </div>
                <span className="text-xs text-[#8BA698] flex-shrink-0 group-hover:text-[#5A7565]">{relTime}</span>
            </Link>
        </motion.div>
    );
}

function ChatWidget({ latestChatId, userName }: { latestChatId: string | null; userName: string }) {
    const router = useRouter();
    const [msg, setMsg] = useState("");
    const submit = () => {
        if (!msg.trim()) return;
        router.push("/dashboard/chat");
    };
    return (
        <div className="bg-white border border-[#E2EDE6] rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#E2EDE6]">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4A9E6B]" />
                    <span className="font-bold text-[15px] text-[#1E2E25]">Otto</span>
                </div>
                <span className="text-[13px] font-medium text-[#8BA698]">Assistente de IA</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 p-5 overflow-y-auto bg-white">
                <div className="flex justify-start">
                    <div className="max-w-[85%] bg-[#EDF4EF] text-[#1E2E25] text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed">
                        Olá {userName?.split(' ')[0] || 'Isaac'}! Como posso ajudar você hoje?
                    </div>
                </div>
                {latestChatId && (
                    <div className="flex justify-end mt-2">
                        <Link href={"/dashboard/chat/" + latestChatId} className="max-w-[82%] bg-[#4A9E6B] text-white text-[13px] font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed hover:bg-[#3B8558] transition-colors">
                            Ver conversa anterior →
                        </Link>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-[#E2EDE6] bg-white">
                <div className="flex items-center gap-2 bg-[#F5F9F6] border border-[#E2EDE6] rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#4A9E6B]/20 focus-within:border-[#4A9E6B]/40 transition-all">
                    <input
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                        placeholder="Pergunte ao Otto..."
                        className="flex-1 bg-transparent text-[14px] text-[#1E2E25] placeholder:text-[#8BA698] outline-none"
                    />
                    <button onClick={submit} className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4A9E6B] text-white hover:bg-[#3B8558] transition-colors flex-shrink-0">
                        <Send size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DashboardHome({ userName, stats, recentActivity, latestChatId }: Props) {
    const [greeting, setGreeting] = useState("Bom dia");

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite");
    }, []);

    const statCards = [
        { label: "Notas",     value: stats.notesCount, trend: stats.notesThisWeek > 0 ? `+${stats.notesThisWeek} esta semana` : "", trendColor: "text-[#6BBF8A]" },
        { label: "Pendentes", value: stats.pendingTasks, trend: stats.pendingTasks > 0 ? `${stats.pendingTasks} para hoje` : "",  trendColor: "text-[#C17D8A]" },
        { label: "Ideias",    value: stats.ideasCount, trend: "", trendColor: "" },
        { label: "Sequência", value: `${stats.streakDays} dias`, trend: "Recorde!", trendColor: "text-[#6B9CC6]" },
    ];

    return (
        <main className="p-6 min-h-full bg-[#F5F9F6] space-y-5">

            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h1 className="font-serif text-2xl font-bold text-[#1E2E25]">
                    {greeting}, {userName}
                </h1>
                <p className="text-[#8BA698] text-sm mt-1">Aqui está um resumo do seu espaço de trabalho</p>
            </motion.div>

            {/* Stats row */}
            <div className="flex gap-3">
                {statCards.map((s, i) => (
                    <StatCard key={s.label} label={s.label} value={s.value} trend={s.trend} trendColor={s.trendColor} delay={0.1 + i * 0.07} />
                ))}
            </div>

            {/* Two columns */}
            <div className="flex flex-col lg:flex-row gap-8 mt-10">

                {/* Left: Chat widget */}
                <motion.div
                    className="flex flex-col w-full lg:w-[45%]"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                >
                    <h2 className="text-[#1E2E25] font-bold text-[17px] mb-4">Assistente</h2>
                    <div className="flex-1 max-h-[500px]">
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
                    <h2 className="text-[#1E2E25] font-bold text-[17px] mb-4">Acesso rápido</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.filter(f => f.id !== "chat").map((f, i) => (
                            <FeatureCard key={f.id} f={f} delay={0.28 + i * 0.06} />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent activity */}
            {recentActivity.length > 0 && (
                <motion.div
                    className="bg-white rounded-2xl border border-[#E2EDE6] overflow-hidden"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 }}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2EDE6]">
                        <h2 className="text-sm font-semibold text-[#1E2E25]">Atividade recente</h2>
                        <span className="text-xs text-[#8BA698]">{recentActivity.length} itens</span>
                    </div>
                    <div className="divide-y divide-[#F0F5F2]">
                        {recentActivity.map((act, i) => (
                            <ActivityRow key={act.href + i} act={act} delay={0.38 + i * 0.05} />
                        ))}
                    </div>
                </motion.div>
            )}

        </main>
    );
}

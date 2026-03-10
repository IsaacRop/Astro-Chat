"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, BookOpen, FileText, Lightbulb, Star, CheckSquare, CalendarDays } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback-dialog";

interface TabDef {
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
    textColor: string;
    bgColor: string;
    indicatorColor: string;
}

const tabs: TabDef[] = [
    { id: "chat",      label: "Chat",       icon: MessageSquare, href: "/chat", badge: "Online",
      textColor: "text-[#4A9E6B]", bgColor: "bg-[#DFF0E5]", indicatorColor: "bg-[#4A9E6B]" },
    { id: "cadernos",  label: "Cadernos",   icon: BookOpen,      href: "/cadernos",       badge: "3",
      textColor: "text-[#5B9E9E]", bgColor: "bg-[#DFF0F0]", indicatorColor: "bg-[#5B9E9E]" },
    { id: "notas",     label: "Notas",      icon: FileText,      href: "/notes",
      textColor: "text-[#6BBF8A]", bgColor: "bg-[#E3F5EB]", indicatorColor: "bg-[#6BBF8A]" },
    { id: "ideias",    label: "Ideias",     icon: Lightbulb,     href: "/ideas",
      textColor: "text-[#9B82B8]", bgColor: "bg-[#EDE3F5]", indicatorColor: "bg-[#9B82B8]" },
    { id: "favoritos",  label: "Favoritos",  icon: Star,          href: "/favorites",
      textColor: "text-[#B89E6B]", bgColor: "bg-[#F2ECD8]", indicatorColor: "bg-[#B89E6B]" },
    { id: "tarefas",   label: "Tarefas",    icon: CheckSquare,   href: "/tasks",          badge: "5",
      textColor: "text-[#C17D8A]", bgColor: "bg-[#F5E3E7]", indicatorColor: "bg-[#C17D8A]" },
    { id: "calendario",label: "Calendário", icon: CalendarDays,  href: "/calendar",
      textColor: "text-[#6B9CC6]", bgColor: "bg-[#E0EBF5]", indicatorColor: "bg-[#6B9CC6]" },
];

function useActiveTab() {
    const pathname = usePathname();
    return (href: string) => {
        if (href === "/chat") return pathname === "/chat" || pathname.startsWith("/chat/");
        return pathname === href || pathname.startsWith(href + "/");
    };
}

function TabBadge({ label, color }: { label: string; color: string }) {
    return (
        <span className={"ml-1.5 px-1.5 py-px text-[9px] font-semibold rounded-full " + color}>
            {label}
        </span>
    );
}

function NavTab({ tab, isActive }: { tab: TabDef; isActive: boolean }) {
    const Icon = tab.icon;
    return (
        <Link
            href={tab.href}
            className={"relative flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-sm font-medium rounded-lg transition-colors duration-150 select-none shrink-0 " +
                (isActive
                    ? tab.textColor + " " + tab.bgColor
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}
        >
            <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{tab.label}</span>

            {tab.badge && (
                <TabBadge
                    label={tab.badge}
                    color={isActive ? tab.textColor + " bg-white/60" : "text-muted-foreground bg-muted"}
                />
            )}

            {isActive && (
                <motion.div
                    layoutId="tab-indicator"
                    className={"absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full " + tab.indicatorColor}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
            )}
        </Link>
    );
}

interface TopNavProps {
    rightElement?: React.ReactNode;
    onMobileMenuToggle?: () => void;
}

export function TopNav({ rightElement, onMobileMenuToggle }: TopNavProps = {}) {
    const isActive = useActiveTab();

    return (
        <header className="hidden md:flex items-center h-[52px] px-3 md:px-4 bg-background border-b border-border flex-shrink-0 gap-2 md:gap-4">
            {/* Left: Brand */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-serif font-bold text-xl text-foreground leading-none">Otto</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full">
                    Beta
                </span>
            </div>

            {/* Divider — hidden on mobile */}
            <div className="hidden md:block w-px h-6 bg-border flex-shrink-0" />

            {/* Center: Feature tabs — horizontally scrollable on mobile */}
            <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => (
                    <NavTab key={tab.id} tab={tab} isActive={isActive(tab.href)} />
                ))}
            </nav>

            {/* Right: Feedback (desktop only) & right element */}
            <div className="flex-shrink-0 flex items-center gap-2">
                <div className="hidden md:flex">
                    <FeedbackDialog>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground transition-colors duration-150">
                            Feedback
                        </button>
                    </FeedbackDialog>
                </div>
                {rightElement}
            </div>
        </header>
    );
}

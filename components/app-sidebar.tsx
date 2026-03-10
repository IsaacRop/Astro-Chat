"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, LogOut, User, Home, HelpCircle, Settings, Bell,
    MessageSquare, BookOpen, FileText, Lightbulb, Star, CheckSquare, CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions/profile";
import { SearchDialog } from "@/components/search-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarUser { name: string; email: string; initials: string; }

function getInitials(name: string | null | undefined, email: string): string {
    if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
}

// ─── Desktop: icon-only button with tooltip ───────────────────────────────────

interface IconButtonProps { icon: React.ReactNode; tooltip: string; onClick?: () => void; href?: string; badge?: boolean; }

function SidebarIconButton({ icon, tooltip, onClick, href, badge }: IconButtonProps) {
    const [showTip, setShowTip] = useState(false);
    const cls = "relative flex items-center justify-center w-10 h-10 rounded-lg text-[#6B8574] hover:text-[#D0E0D6] hover:bg-[#2A3E32] transition-colors duration-150 cursor-pointer";
    const tipCls = "absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#2A3E32] text-[#D0E0D6] text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-lg border border-[#3B5040]";
    const button = (
        <span className={cls} onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)} onClick={onClick}>
            {icon}
            {badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4A9E6B] ring-2 ring-[#1E2E25]" />}
            <AnimatePresence>
                {showTip && (
                    <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className={tipCls}
                    >
                        {tooltip}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
    if (href) return <Link href={href}>{button}</Link>;
    return button;
}

// ─── Desktop sidebar content (icon-only, 68px) ────────────────────────────────

function SidebarContent({
    user, dropdownOpen, setDropdownOpen, setSearchOpen, dropdownRef, onClose,
}: {
    user: SidebarUser | null;
    dropdownOpen: boolean;
    setDropdownOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
    setSearchOpen: (v: boolean) => void;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    onClose?: () => void;
}) {
    return (
        <>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A9E6B] to-[#5B9E9E] shadow-md mb-2 flex-shrink-0">
                <span className="text-white font-serif font-bold text-lg leading-none select-none">O</span>
            </div>
            <div className="flex flex-col items-center gap-1 mt-1">
                <SidebarIconButton icon={<Home size={18} />} tooltip="Home" href="/" onClick={onClose} />
                <SidebarIconButton icon={<Search size={18} />} tooltip="Buscar ⌘K" onClick={() => { setSearchOpen(true); onClose?.(); }} />
            </div>
            <div className="flex-1" />
            <div className="flex flex-col items-center gap-1">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen((v) => !v)}
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#4A9E6B] to-[#3B8558] text-white text-sm font-bold hover:opacity-90 transition-opacity select-none"
                        aria-label="Menu do perfil"
                    >
                        {user?.initials ?? "??"}
                    </button>
                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="fixed bottom-0 left-0 right-0 rounded-t-2xl sm:absolute sm:bottom-full sm:left-full sm:right-auto sm:ml-3 sm:mb-1 sm:w-52 sm:rounded-xl bg-popover border border-border shadow-2xl overflow-hidden z-[60] sm:origin-bottom-left"
                            >
                                <div className="px-4 py-3 border-b border-border">
                                    <p className="text-popover-foreground text-sm font-semibold truncate">{user?.name ?? "Carregando..."}</p>
                                    <p className="text-muted-foreground text-xs truncate mt-0.5">{user?.email ?? ""}</p>
                                    <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-semibold rounded-full border border-primary/30">Plano Gratuito</span>
                                </div>
                                <div className="py-1">
                                    <DropdownLink href="/profile" icon={<User size={14} />} label="Perfil" onClick={() => { setDropdownOpen(false); onClose?.(); }} />
                                    <DropdownLink href="/settings" icon={<Settings size={14} />} label="Configurações" onClick={() => { setDropdownOpen(false); onClose?.(); }} />
                                    <DropdownLink href="/help" icon={<HelpCircle size={14} />} label="Ajuda" onClick={() => { setDropdownOpen(false); onClose?.(); }} />
                                </div>
                                <div className="border-t border-border py-1">
                                    <form action={signOut}>
                                        <button type="submit" className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150">
                                            <LogOut size={14} />
                                            Sair
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}

// ─── Mobile nav tab definitions ───────────────────────────────────────────────

const mobileTabs: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
}> = [
    { id: "chat",       label: "Chat",       icon: MessageSquare, href: "/dashboard/chat", badge: "Online",
      textClass: "text-[#4A9E6B]", bgClass: "bg-[#4A9E6B]/10", borderClass: "border-[#4A9E6B]" },
    { id: "cadernos",   label: "Cadernos",   icon: BookOpen,      href: "/cadernos",       badge: "3",
      textClass: "text-[#5B9E9E]", bgClass: "bg-[#5B9E9E]/10", borderClass: "border-[#5B9E9E]" },
    { id: "notas",      label: "Notas",      icon: FileText,      href: "/notes",
      textClass: "text-[#6BBF8A]", bgClass: "bg-[#6BBF8A]/10", borderClass: "border-[#6BBF8A]" },
    { id: "ideias",     label: "Ideias",     icon: Lightbulb,     href: "/ideas",
      textClass: "text-[#9B82B8]", bgClass: "bg-[#9B82B8]/10", borderClass: "border-[#9B82B8]" },
    { id: "favoritos",  label: "Favoritos",  icon: Star,          href: "/favorites",
      textClass: "text-[#B89E6B]", bgClass: "bg-[#B89E6B]/10", borderClass: "border-[#B89E6B]" },
    { id: "tarefas",    label: "Tarefas",    icon: CheckSquare,   href: "/tasks",          badge: "5",
      textClass: "text-[#C17D8A]", bgClass: "bg-[#C17D8A]/10", borderClass: "border-[#C17D8A]" },
    { id: "calendario", label: "Calendário", icon: CalendarDays,  href: "/calendar",
      textClass: "text-[#6B9CC6]", bgClass: "bg-[#6B9CC6]/10", borderClass: "border-[#6B9CC6]" },
];

// ─── Mobile sidebar content (full navigation, 288px / w-72) ──────────────────

function MobileSidebarContent({ user, onClose, setSearchOpen }: {
    user: SidebarUser | null;
    onClose?: () => void;
    setSearchOpen: (v: boolean) => void;
}) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard/chat") return pathname === "/dashboard/chat" || pathname.startsWith("/dashboard/chat/");
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* Logo + Beta */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2A3E32] flex-shrink-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#4A9E6B] to-[#5B9E9E] shadow-md flex-shrink-0">
                    <span className="text-white font-serif font-bold text-base leading-none select-none">O</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xl text-white leading-none">Otto</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#4A9E6B]/20 text-[#4A9E6B] rounded-full border border-[#4A9E6B]/30">Beta</span>
                </div>
            </div>

            {/* Search bar */}
            <div className="px-4 py-3 border-b border-[#2A3E32] flex-shrink-0">
                <button
                    onClick={() => { setSearchOpen(true); onClose?.(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg bg-[#2A3E32] text-[#6B8574] hover:text-[#D0E0D6] transition-colors duration-150 text-sm"
                >
                    <Search size={16} strokeWidth={1.8} className="flex-shrink-0" />
                    <span className="flex-1 text-left">Buscar...</span>
                    <span className="text-[10px] bg-[#1E2E25] px-1.5 py-0.5 rounded border border-[#3B5040] font-mono flex-shrink-0">⌘K</span>
                </button>
            </div>

            {/* Feature navigation */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                {mobileTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 py-3 pr-4 min-h-[44px] rounded-lg transition-colors duration-150 ${
                                active
                                    ? `${tab.textClass} ${tab.bgClass} border-l-[3px] ${tab.borderClass} pl-[13px]`
                                    : "text-[#D0E0D6] hover:bg-[#2A3E32] pl-4"
                            }`}
                        >
                            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
                            <span className="flex-1 text-sm font-medium">{tab.label}</span>
                            {tab.badge && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${
                                    active
                                        ? "bg-white/20 text-current"
                                        : "bg-[#2A3E32] text-[#6B8574]"
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Utility links */}
            <div className="border-t border-[#2A3E32] px-3 py-2 space-y-0.5 flex-shrink-0">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-lg text-[#6B8574] hover:text-[#D0E0D6] hover:bg-[#2A3E32] transition-colors duration-150 text-sm relative">
                    <Bell size={18} strokeWidth={1.8} className="flex-shrink-0" />
                    <span>Notificações</span>
                    <span className="absolute top-3.5 left-[26px] w-2 h-2 rounded-full bg-[#4A9E6B] ring-2 ring-[#1E2E25]" />
                </button>
                <Link href="/help" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-lg text-[#6B8574] hover:text-[#D0E0D6] hover:bg-[#2A3E32] transition-colors duration-150 text-sm">
                    <HelpCircle size={18} strokeWidth={1.8} className="flex-shrink-0" />
                    <span>Ajuda</span>
                </Link>
                <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-lg text-[#6B8574] hover:text-[#D0E0D6] hover:bg-[#2A3E32] transition-colors duration-150 text-sm">
                    <Settings size={18} strokeWidth={1.8} className="flex-shrink-0" />
                    <span>Configurações</span>
                </Link>
            </div>

            {/* Profile section */}
            <div className="border-t border-[#2A3E32] px-4 py-4 flex-shrink-0">
                <Link href="/profile" onClick={onClose} className="flex items-center gap-3 min-w-0 mb-3 group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#4A9E6B] to-[#3B8558] text-white text-sm font-bold flex-shrink-0">
                        {user?.initials ?? "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[#D0E0D6] text-sm font-medium truncate group-hover:text-white transition-colors">{user?.name ?? "Carregando..."}</p>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-[#4A9E6B]/20 text-[#4A9E6B] text-[10px] font-semibold rounded-full border border-[#4A9E6B]/30">Plano Gratuito</span>
                    </div>
                </Link>
                <form action={signOut}>
                    <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-[#6B8574] hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 text-sm">
                        <LogOut size={16} strokeWidth={1.8} className="flex-shrink-0" />
                        <span>Sair da conta</span>
                    </button>
                </form>
            </div>

        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface AppSidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
    const [user, setUser] = useState<SidebarUser | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
                setUser({ name: name ?? user.email ?? "Usuário", email: user.email ?? "", initials: getInitials(name, user.email ?? "") });
            }
        });
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const sharedProps = { user, dropdownOpen, setDropdownOpen, setSearchOpen, dropdownRef };

    return (
        <>
            {/* Desktop sidebar — icon-only, 68px */}
            <aside className="hidden md:flex flex-col items-center w-[68px] h-screen bg-[#1E2E25] border-r border-[#2A3E32] py-3 gap-1 flex-shrink-0 z-40">
                <SidebarContent {...sharedProps} />
            </aside>

            {/* Mobile overlay — full navigation, 288px */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onMobileClose}
                            aria-hidden="true"
                        />
                        <motion.aside
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-[#1E2E25] border-r border-[#2A3E32] md:hidden overflow-hidden shadow-2xl"
                            initial={{ x: -288 }}
                            animate={{ x: 0 }}
                            exit={{ x: -288 }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        >
                            <MobileSidebarContent
                                user={user}
                                onClose={onMobileClose}
                                setSearchOpen={setSearchOpen}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function DropdownLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void; }) {
    return (
        <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#8BA698] hover:text-[#D0E0D6] hover:bg-[#2A3E32] transition-colors duration-150">
            {icon}
            {label}
        </Link>
    );
}

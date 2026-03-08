"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, HelpCircle, Settings, LogOut, User, CreditCard, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions/profile";

interface SidebarUser { name: string; email: string; initials: string; }

function getInitials(name: string | null | undefined, email: string): string {
    if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
}

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

export function AppSidebar() {
    const [user, setUser] = useState<SidebarUser | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
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

    return (
        <aside className="hidden md:flex flex-col items-center w-[68px] h-screen bg-[#1E2E25] border-r border-[#2A3E32] py-3 gap-1 flex-shrink-0 z-40">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A9E6B] to-[#5B9E9E] shadow-md mb-2 flex-shrink-0">
                <span className="text-white font-serif font-bold text-lg leading-none select-none">O</span>
            </div>
            <div className="flex flex-col items-center gap-1 mt-1">
                <SidebarIconButton icon={<Search size={18} />} tooltip="Buscar ⌘K" />
                <SidebarIconButton icon={<Bell size={18} />} tooltip="Notificações" badge />
                <SidebarIconButton icon={<HelpCircle size={18} />} tooltip="Ajuda" />
            </div>
            <div className="flex-1" />
            <div className="flex flex-col items-center gap-1">
                <SidebarIconButton icon={<Settings size={18} />} tooltip="Configurações" href="/settings" />
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
                                className="absolute bottom-full left-full ml-3 mb-1 w-52 bg-[#1A2B20] border border-[#2A3E32] rounded-xl shadow-2xl overflow-hidden z-50 origin-bottom-left"
                            >
                                <div className="px-4 py-3 border-b border-[#2A3E32]">
                                    <p className="text-[#D0E0D6] text-sm font-semibold truncate">{user?.name ?? "Carregando..."}</p>
                                    <p className="text-[#6B8574] text-xs truncate mt-0.5">{user?.email ?? ""}</p>
                                    <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-[#4A9E6B]/20 text-[#4A9E6B] text-[10px] font-semibold rounded-full border border-[#4A9E6B]/30">Plano Gratuito</span>
                                </div>
                                <div className="py-1">
                                    <DropdownLink href="/settings" icon={<User size={14} />} label="Perfil" onClick={() => setDropdownOpen(false)} />
                                    <DropdownLink href="/settings" icon={<CreditCard size={14} />} label="Assinatura" onClick={() => setDropdownOpen(false)} />
                                    <DropdownLink href="/settings" icon={<SlidersHorizontal size={14} />} label="Preferências" onClick={() => setDropdownOpen(false)} />
                                </div>
                                <div className="border-t border-[#2A3E32] py-1">
                                    <form action={signOut}>
                                        <button type="submit" className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-150">
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
        </aside>
    );
}

function DropdownLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void; }) {
    return (
        <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#8BA698] hover:text-[#D0E0D6] hover:bg-[#2A3E32] transition-colors duration-150">
            {icon}
            {label}
        </Link>
    );
}

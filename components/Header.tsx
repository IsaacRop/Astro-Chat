"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LimelightNav } from "@/components/ui/limelight-nav";
import { DockTabs } from "@/components/ui/dock-tabs";
import { MobileNav } from "@/components/mobile-nav";

interface HeaderProps {
    title?: string;
    showNav?: boolean;
}

export function Header({ title = "Otto", showNav = true }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <header className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 h-[57px] md:h-[73px]">
                <div className="w-20 md:w-24 h-5 md:h-6 rounded bg-muted animate-pulse" />
                <div className="flex-1" />
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            </header>
        );
    }

    return (
        <header className="flex items-center justify-between gap-2 p-2 px-3 md:p-3 md:px-4 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            {/* Left: Mobile Nav + Logo */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {/* Mobile hamburger menu - only on small screens */}
                {showNav && <MobileNav />}

                {/* Logo/Title */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#4A9E6B] to-[#5B9E9E] shadow-sm flex-shrink-0">
                        <span className="text-white font-serif font-bold text-lg md:text-xl leading-none select-none">O</span>
                    </div>
                    <span className="text-base md:text-lg font-serif font-bold text-foreground transition-colors hidden sm:block">
                        {title}
                    </span>
                    <span className="px-1.5 py-0.5 text-[8px] md:text-[9px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 rounded-full hidden sm:block">
                        Beta
                    </span>
                </Link>
            </div>

            {/* Center: Navigation Dock - Hidden on mobile */}
            {showNav && (
                <div className="flex-1 hidden md:flex justify-center overflow-visible">
                    <DockTabs />
                </div>
            )}

            {/* Right: Theme Toggle */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors relative overflow-hidden"
                    title="Alternar Tema"
                >
                    <motion.div
                        initial={false}
                        animate={{ rotate: theme === "dark" ? 180 : 0, scale: theme === "dark" ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Moon size={18} className="fill-current md:w-5 md:h-5" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ rotate: theme === "dark" ? -180 : 0, scale: theme === "dark" ? 0 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="block"
                    >
                        <Sun size={18} className="md:w-5 md:h-5" />
                    </motion.div>
                </button>
            </div>
        </header>
    );
}

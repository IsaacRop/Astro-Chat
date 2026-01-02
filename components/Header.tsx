"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LimelightNav } from "@/components/ui/limelight-nav";

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
            {/* Logo/Title */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                {/* Octopus Icon */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-7 h-7 md:w-8 md:h-8 text-accent-purple"
                >
                    {/* Head */}
                    <ellipse cx="12" cy="8" rx="7" ry="6" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                    {/* Eyes */}
                    <circle cx="9" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="9.5" cy="6.5" r="0.5" fill="white" />
                    <circle cx="15.5" cy="6.5" r="0.5" fill="white" />
                    {/* Tentacles - 8 curling arms */}
                    <path d="M5 12 Q3 15 4 18 Q5 20 6 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M7 13 Q6 16 6 18 Q6 21 8 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M9 14 Q9 17 8 19 Q7 22 10 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M12 14 Q12 18 11 20 Q10 22 13 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M15 14 Q15 17 16 19 Q17 22 14 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M17 13 Q18 16 18 18 Q18 21 16 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M19 12 Q21 15 20 18 Q19 20 18 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
                <span className="text-base md:text-lg font-serif font-bold text-foreground group-hover:text-accent-purple transition-colors hidden sm:block">
                    {title}
                </span>
            </Link>

            {/* Center: Navigation Bar */}
            {showNav && (
                <div className="flex-1 flex justify-center overflow-x-auto scrollbar-hide">
                    <LimelightNav />
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

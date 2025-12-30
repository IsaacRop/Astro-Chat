"use client";

import { useTheme } from "next-themes";
import { ArrowLeft, Moon, Sun, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HeaderProps {
    title?: string;
    backLink?: string;
    showMenuButton?: boolean;
    onMenuClick?: () => void;
}

export function Header({ title = "Astro", backLink = "/", showMenuButton = false, onMenuClick }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <header className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 h-[57px] md:h-[73px]">
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                <div className="w-20 md:w-24 h-5 md:h-6 rounded bg-muted animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            </header>
        );
    }

    return (
        <header className="flex items-center justify-between p-3 px-4 md:p-4 md:px-6 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2 md:gap-3">
                {/* Menu Button (Mobile) or Back Button */}
                {showMenuButton && onMenuClick ? (
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors md:hidden"
                    >
                        <Menu size={20} />
                    </button>
                ) : backLink ? (
                    <Link
                        href={backLink}
                        className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                ) : (
                    <div className="w-9" />
                )}

                {/* Title */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="text-lg md:text-xl font-serif font-bold text-foreground group-hover:text-accent-purple transition-colors truncate max-w-[150px] sm:max-w-none">
                        {title}
                    </div>
                </Link>
            </div>

            {/* Right: Theme Toggle */}
            <div className="flex items-center gap-1 md:gap-2">
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

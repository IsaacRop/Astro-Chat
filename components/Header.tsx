"use client";

import { useTheme } from "next-themes";
import { ArrowLeft, Moon, Sun, Monitor, Menu } from "lucide-react";
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

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 h-[73px]">
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                <div className="w-24 h-6 rounded bg-muted animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            </header>
        );
    }

    return (
        <header className="flex items-center justify-between p-4 px-6 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3">
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
                    <div className="w-9" /> /* Spacer if no back button/menu */
                )}

                {/* Title */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="text-xl font-serif font-bold text-foreground group-hover:text-accent-purple transition-colors">
                        {title}
                    </div>
                </Link>
            </div>

            {/* Right: Theme Toggle & Actions */}
            <div className="flex items-center gap-2">
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
                        <Moon size={20} className="fill-current" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ rotate: theme === "dark" ? -180 : 0, scale: theme === "dark" ? 0 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="block"
                    >
                        <Sun size={20} className="" />
                    </motion.div>
                </button>
            </div>
        </header>
    );
}

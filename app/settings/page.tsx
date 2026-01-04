"use client";

import { Header } from "@/components/Header";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Star } from "lucide-react";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <Header title="Settings" backLink="/" />

            <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6 md:space-y-8">
                {/* Theme Section */}
                <section className="space-y-4">
                    <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground border-b border-border pb-2">Appearance</h2>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        <button
                            onClick={() => setTheme("light")}
                            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all ${theme === "light"
                                ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                                : "border-border hover:border-accent-blue/50 text-muted-foreground"
                                }`}
                        >
                            <Sun size={24} className="mb-2 md:mb-3 md:w-8 md:h-8" />
                            <span className="font-medium text-sm md:text-base">Light</span>
                        </button>

                        <button
                            onClick={() => setTheme("dark")}
                            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all ${theme === "dark"
                                ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                                : "border-border hover:border-accent-purple/50 text-muted-foreground"
                                }`}
                        >
                            <Moon size={24} className="mb-2 md:mb-3 md:w-8 md:h-8" />
                            <span className="font-medium text-sm md:text-base">Dark</span>
                        </button>

                        <button
                            onClick={() => setTheme("system")}
                            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all ${theme === "system"
                                ? "border-accent-green bg-accent-green/10 text-accent-green"
                                : "border-border hover:border-accent-green/50 text-muted-foreground"
                                }`}
                        >
                            <Monitor size={24} className="mb-2 md:mb-3 md:w-8 md:h-8" />
                            <span className="font-medium text-sm md:text-base">System</span>
                        </button>
                    </div>
                </section>

                {/* About Section */}
                <section className="space-y-4">
                    <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground border-b border-border pb-2">About Otto</h2>
                    <div className="bg-card border border-border rounded-xl p-4 md:p-6 flex items-center gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-accent-purple/30 to-accent-blue/30 flex items-center justify-center">
                            <Star className="w-6 h-6 md:w-8 md:h-8 text-accent-purple" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-foreground">Otto AI</h3>
                            <p className="text-muted-foreground text-xs md:text-sm">Version 1.0.0 (Cosmic)</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-sm text-sm md:text-base">
                        Next Generation AI Assistant designed for clarity, creativity, and exploration.
                    </p>
                </section>
            </main>
        </div>
    );
}

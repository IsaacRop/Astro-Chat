"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Notebook, FileText, CheckSquare, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const menuItems = [
    { icon: MessageCircle, label: "Chat", href: "/chat", color: "var(--accent-blue)" },
    { icon: Notebook, label: "Notebooks", href: "/cadernos", color: "var(--accent-purple)" },
    { icon: FileText, label: "Notes", href: "/notes", color: "var(--accent-yellow)" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks", color: "var(--accent-green)" },
    { icon: Settings, label: "Settings", href: "/settings", color: "var(--accent-orange)" },
];

export const OrbitalMenu = ({ children }: { children: React.ReactNode }) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    return (
        <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            {/* Central Mascot */}
            <div className="z-10">{children}</div>

            {/* Orbit Ring */}
            <motion.div
                animate={{ rotate: hoveredItem ? 0 : 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none"
            >
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500">
                    <circle
                        cx="250"
                        cy="250"
                        r="200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="8 8"
                        className="text-foreground/20"
                    />
                </svg>

                {/* Orbiting Nodes */}
                {menuItems.map((item, index) => {
                    const angle = (index / menuItems.length) * 2 * Math.PI - Math.PI / 2; // Start from top
                    const radius = 200;
                    const x = 250 + radius * Math.cos(angle);
                    const y = 250 + radius * Math.sin(angle);
                    const isHovered = hoveredItem === item.label;

                    return (
                        <Link key={item.label} href={item.href} legacyBehavior>
                            <motion.a
                                className="absolute flex flex-col items-center gap-2 cursor-pointer pointer-events-auto"
                                style={{
                                    left: x - 32,
                                    top: y - 32,
                                }}
                                whileHover={{ scale: 1.15 }}
                                onMouseEnter={() => setHoveredItem(item.label)}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {/* Icon Circle */}
                                <motion.div
                                    className="w-16 h-16 rounded-full bg-background border-2 flex items-center justify-center shadow-lg transition-colors"
                                    style={{
                                        borderColor: isHovered ? item.color : 'var(--border)',
                                        boxShadow: isHovered ? `0 0 20px ${item.color}` : undefined,
                                    }}
                                >
                                    <item.icon
                                        className="w-6 h-6 transition-colors"
                                        style={{ color: item.color }}
                                    />
                                </motion.div>

                                {/* Label - Shows on Hover */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute -bottom-7 text-xs font-medium px-2 py-0.5 rounded-md bg-card border border-border shadow-md whitespace-nowrap"
                                            style={{ color: item.color }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.a>
                        </Link>
                    );
                })}
            </motion.div>
        </div>
    );
};

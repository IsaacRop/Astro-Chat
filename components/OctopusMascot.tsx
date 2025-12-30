"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Notebook, FileText, CheckSquare, Settings, Calendar, Lightbulb, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const tentacleItems = [
    { icon: Notebook, label: "Notebooks", href: "/cadernos", color: "var(--accent-purple)" },
    { icon: FileText, label: "Notes", href: "/notes", color: "var(--accent-yellow)" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks", color: "var(--accent-green)" },
    { icon: Settings, label: "Settings", href: "/settings", color: "var(--accent-orange)" },
    { icon: MessageCircle, label: "Chat", href: "/chat", color: "var(--accent-blue)" },
    { icon: Calendar, label: "Calendar", href: "/calendar", color: "var(--accent-blue)" },
    { icon: Lightbulb, label: "Ideas", href: "/ideas", color: "var(--accent-purple)" },
    { icon: Star, label: "Favorites", href: "/favorites", color: "var(--accent-yellow)" },
];

// Icon positions around the octopus (all below/around, not overlapping head)
const iconPositions = [
    { x: 80, y: 290 },   // top-left
    { x: 180, y: 340 },  // upper-left
    { x: 280, y: 400 },  // left
    { x: 350, y: 440 },  // bottom-left
    { x: 450, y: 440 },  // bottom-right  
    { x: 520, y: 400 },  // right
    { x: 620, y: 340 },  // upper-right
    { x: 720, y: 290 },  // top-right
];

// Animated Octopus SVG Component with eye tracking
const AnimatedOctopus = ({ iconPositions }: { iconPositions: { x: number; y: number }[] }) => {
    const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + 120;

            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            const angle = Math.atan2(deltaY, deltaX);
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 25, 8);

            setPupilOffset({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Centro do polvo
    const centerX = 400;
    const headY = 130;

    return (
        <motion.svg
            ref={svgRef}
            width="800"
            height="520"
            viewBox="0 0 800 520"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="drop-shadow-[0_0_40px_rgba(147,112,219,0.5)]"
        >
            {/* Gradients - defined first */}
            <defs>
                <linearGradient id="octopusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="50%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="tentacleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>

            {/* LAYER 1: Tentacles - drawn FIRST (behind the head) */}
            {iconPositions.map((pos, i) => {
                // Tentacles start from the center/bottom of the head
                const startX = centerX + (i - 3.5) * 18;
                const startY = headY + 60; // Start from lower part of head
                const endX = pos.x;
                const endY = pos.y - 30;

                // Control points for smooth curves
                const ctrl1X = startX + (endX - startX) * 0.25;
                const ctrl1Y = startY + 70;
                const ctrl2X = startX + (endX - startX) * 0.7;
                const ctrl2Y = endY - 25;

                return (
                    <motion.path
                        key={i}
                        d={`M${startX} ${startY} C${ctrl1X} ${ctrl1Y} ${ctrl2X} ${ctrl2Y} ${endX} ${endY}`}
                        stroke="url(#tentacleGradient)"
                        strokeWidth="22"
                        strokeLinecap="round"
                        fill="none"
                        animate={{
                            d: [
                                `M${startX} ${startY} C${ctrl1X} ${ctrl1Y} ${ctrl2X} ${ctrl2Y} ${endX} ${endY}`,
                                `M${startX} ${startY} C${ctrl1X + 10} ${ctrl1Y + 8} ${ctrl2X - 6} ${ctrl2Y + 10} ${endX} ${endY}`,
                                `M${startX} ${startY} C${ctrl1X - 6} ${ctrl1Y - 6} ${ctrl2X + 10} ${ctrl2Y - 6} ${endX} ${endY}`,
                                `M${startX} ${startY} C${ctrl1X} ${ctrl1Y} ${ctrl2X} ${ctrl2Y} ${endX} ${endY}`,
                            ],
                        }}
                        transition={{
                            duration: 3 + i * 0.15,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1,
                        }}
                    />
                );
            })}

            {/* LAYER 2: Suction cups on tentacles */}
            {iconPositions.map((pos, i) => {
                const startX = centerX + (i - 3.5) * 18;
                const startY = headY + 60;
                const endX = pos.x;
                const endY = pos.y - 30;

                // Add 3 suction cups along each tentacle (skip near head)
                return [0.45, 0.65, 0.85].map((t, j) => {
                    const cupX = startX + (endX - startX) * t;
                    const cupY = startY + (endY - startY) * t + Math.sin(t * Math.PI) * 20;
                    return (
                        <circle
                            key={`cup-${i}-${j}`}
                            cx={cupX}
                            cy={cupY}
                            r={5 - j * 0.8}
                            fill="#d6bcfa"
                            opacity={0.7}
                        />
                    );
                });
            })}

            {/* LAYER 3: Octopus Head - drawn AFTER tentacles (ON TOP) */}
            <ellipse
                cx={centerX}
                cy={headY}
                rx="90"
                ry="80"
                fill="url(#octopusGradient)"
                stroke="#9f7aea"
                strokeWidth="3"
            />

            {/* LAYER 4: Graduation Cap - on top of head */}
            <g transform={`translate(${centerX}, 45)`}>
                {/* Cap top */}
                <polygon
                    points="-70,0 0,-30 70,0 0,30"
                    fill="#4a5568"
                    stroke="#2d3748"
                    strokeWidth="2"
                />
                {/* Cap base */}
                <ellipse cx="0" cy="22" rx="48" ry="13" fill="#2d3748" />
                {/* Tassel */}
                <line x1="45" y1="0" x2="75" y2="45" stroke="#ecc94b" strokeWidth="4" />
                <motion.circle
                    cx="78"
                    cy="50"
                    r="9"
                    fill="#ecc94b"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </g>

            {/* LAYER 5: Face details - on top of everything */}
            {/* Cheeks */}
            <ellipse cx={centerX - 65} cy={headY + 30} rx="15" ry="10" fill="#f9a8d4" opacity="0.5" />
            <ellipse cx={centerX + 65} cy={headY + 30} rx="15" ry="10" fill="#f9a8d4" opacity="0.5" />

            {/* Left Eye */}
            <g transform={`translate(${centerX - 35}, ${headY})`}>
                <ellipse cx="0" cy="0" rx="24" ry="28" fill="white" />
                <motion.circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill="#2d3748"
                    animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                />
                <circle cx="-4" cy="-7" r="5" fill="white" opacity="0.9" />
            </g>

            {/* Right Eye */}
            <g transform={`translate(${centerX + 35}, ${headY})`}>
                <ellipse cx="0" cy="0" rx="24" ry="28" fill="white" />
                <motion.circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill="#2d3748"
                    animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                />
                <circle cx="-4" cy="-7" r="5" fill="white" opacity="0.9" />
            </g>

            {/* Smile */}
            <path
                d={`M${centerX - 30} ${headY + 45} Q${centerX} ${headY + 68} ${centerX + 30} ${headY + 45}`}
                stroke="#553c9a"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />
        </motion.svg>
    );
};

export const OctopusMascot = () => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    return (
        <div className="relative w-[800px] h-[520px] flex items-center justify-start">
            {/* Animated SVG Octopus */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <AnimatedOctopus iconPositions={iconPositions} />
            </div>

            {/* Interactive Icons at tentacle ends */}
            {tentacleItems.map((item, index) => {
                const pos = iconPositions[index];
                const isHovered = hoveredItem === item.label;

                return (
                    <Link key={item.label} href={item.href} legacyBehavior>
                        <motion.a
                            className="absolute flex flex-col items-center gap-2 cursor-pointer z-20"
                            style={{
                                left: pos.x - 28,
                                top: pos.y - 28,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: 1,
                                scale: isHovered ? 1.2 : 1,
                            }}
                            transition={{
                                delay: index * 0.08,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            whileHover={{ scale: 1.25 }}
                            onMouseEnter={() => setHoveredItem(item.label)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            {/* Glowing Circle */}
                            <motion.div
                                className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300"
                                style={{
                                    background: isHovered
                                        ? `linear-gradient(135deg, ${item.color}40, ${item.color}20)`
                                        : 'rgba(30, 30, 50, 0.8)',
                                    border: `2px solid ${isHovered ? item.color : 'rgba(255,255,255,0.2)'}`,
                                    boxShadow: isHovered
                                        ? `0 0 25px ${item.color}, 0 0 50px ${item.color}40`
                                        : '0 4px 20px rgba(0,0,0,0.3)',
                                }}
                            >
                                <item.icon
                                    className="w-6 h-6 transition-all duration-300"
                                    style={{
                                        color: item.color,
                                        filter: isHovered ? `drop-shadow(0 0 8px ${item.color})` : 'none'
                                    }}
                                />
                            </motion.div>

                            {/* Label - Shows on Hover */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.span
                                        initial={{ opacity: 0, y: -8, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute -bottom-8 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-md"
                                        style={{
                                            color: item.color,
                                            background: 'rgba(30, 30, 50, 0.9)',
                                            border: `1px solid ${item.color}50`,
                                            boxShadow: `0 0 15px ${item.color}30`
                                        }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.a>
                    </Link>
                );
            })}
        </div>
    );
};

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Notebook, FileText, CheckSquare, Settings, Calendar, Lightbulb, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const tentacleItems = [
    { icon: Notebook, label: "Notebooks", href: "/cadernos", color: "var(--accent-purple)" },
    { icon: FileText, label: "Notes", href: "/notes", color: "var(--accent-yellow)" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks", color: "var(--accent-green)" },
    { icon: MessageCircle, label: "Chat", href: "/chat", color: "var(--accent-blue)" },
    { icon: Calendar, label: "Calendar", href: "/calendar", color: "var(--accent-blue)" },
    { icon: Lightbulb, label: "Ideas", href: "/ideas", color: "var(--accent-purple)" },
    { icon: Star, label: "Favorites", href: "/favorites", color: "var(--accent-yellow)" },
];

// Responsive icon positions - calculated based on container size (7 items now)
const getIconPositions = (scale: number) => [
    { x: 80 * scale, y: 310 * scale },
    { x: 160 * scale, y: 370 * scale },
    { x: 280 * scale, y: 420 * scale },
    { x: 400 * scale, y: 450 * scale },
    { x: 520 * scale, y: 420 * scale },
    { x: 640 * scale, y: 370 * scale },
    { x: 720 * scale, y: 310 * scale },
];

// Animated Octopus SVG Component with eye tracking
const AnimatedOctopus = ({ scale = 1 }: { scale?: number }) => {
    const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    const iconPositions = getIconPositions(scale);
    const centerX = 400 * scale;
    const headY = 130 * scale;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            const svgCenterX = rect.left + rect.width / 2;
            const svgCenterY = rect.top + (120 * scale);

            const deltaX = e.clientX - svgCenterX;
            const deltaY = e.clientY - svgCenterY;
            const angle = Math.atan2(deltaY, deltaX);
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 25, 8 * scale);

            setPupilOffset({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
            });
        };

        // Also handle touch for mobile
        const handleTouchMove = (e: TouchEvent) => {
            if (!svgRef.current || !e.touches[0]) return;

            const rect = svgRef.current.getBoundingClientRect();
            const svgCenterX = rect.left + rect.width / 2;
            const svgCenterY = rect.top + (120 * scale);

            const deltaX = e.touches[0].clientX - svgCenterX;
            const deltaY = e.touches[0].clientY - svgCenterY;
            const angle = Math.atan2(deltaY, deltaX);
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 25, 8 * scale);

            setPupilOffset({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [scale]);

    return (
        <motion.svg
            ref={svgRef}
            width={800 * scale}
            height={520 * scale}
            viewBox={`0 0 ${800 * scale} ${520 * scale}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ y: [0, -6 * scale, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="drop-shadow-[0_0_40px_rgba(147,112,219,0.5)] max-w-full"
            style={{ width: '100%', height: 'auto' }}
        >
            {/* Gradients */}
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

            {/* LAYER 1: Tentacles - now 7 */}
            {iconPositions.map((pos, i) => {
                const startX = centerX + (i - 3) * 20 * scale;
                const startY = headY + 60 * scale;
                const endX = pos.x;
                const endY = pos.y - 30 * scale;

                const ctrl1X = startX + (endX - startX) * 0.25;
                const ctrl1Y = startY + 70 * scale;
                const ctrl2X = startX + (endX - startX) * 0.7;
                const ctrl2Y = endY - 25 * scale;

                return (
                    <motion.path
                        key={i}
                        d={`M${startX} ${startY} C${ctrl1X} ${ctrl1Y} ${ctrl2X} ${ctrl2Y} ${endX} ${endY}`}
                        stroke="url(#tentacleGradient)"
                        strokeWidth={22 * scale}
                        strokeLinecap="round"
                        fill="none"
                        animate={{
                            d: [
                                `M${startX} ${startY} C${ctrl1X} ${ctrl1Y} ${ctrl2X} ${ctrl2Y} ${endX} ${endY}`,
                                `M${startX} ${startY} C${ctrl1X + 10 * scale} ${ctrl1Y + 8 * scale} ${ctrl2X - 6 * scale} ${ctrl2Y + 10 * scale} ${endX} ${endY}`,
                                `M${startX} ${startY} C${ctrl1X - 6 * scale} ${ctrl1Y - 6 * scale} ${ctrl2X + 10 * scale} ${ctrl2Y - 6 * scale} ${endX} ${endY}`,
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

            {/* LAYER 2: Suction cups */}
            {iconPositions.map((pos, i) => {
                const startX = centerX + (i - 3) * 20 * scale;
                const startY = headY + 60 * scale;
                const endX = pos.x;
                const endY = pos.y - 30 * scale;

                return [0.45, 0.65, 0.85].map((t, j) => {
                    const cupX = startX + (endX - startX) * t;
                    const cupY = startY + (endY - startY) * t + Math.sin(t * Math.PI) * 20 * scale;
                    return (
                        <circle
                            key={`cup-${i}-${j}`}
                            cx={cupX}
                            cy={cupY}
                            r={(5 - j * 0.8) * scale}
                            fill="#d6bcfa"
                            opacity={0.7}
                        />
                    );
                });
            })}

            {/* LAYER 3: Octopus Head */}
            <ellipse
                cx={centerX}
                cy={headY}
                rx={90 * scale}
                ry={80 * scale}
                fill="url(#octopusGradient)"
                stroke="#9f7aea"
                strokeWidth={3 * scale}
            />

            {/* LAYER 4: Graduation Cap */}
            <g transform={`translate(${centerX}, ${45 * scale})`}>
                <polygon
                    points={`${-70 * scale},0 0,${-30 * scale} ${70 * scale},0 0,${30 * scale}`}
                    fill="#4a5568"
                    stroke="#2d3748"
                    strokeWidth={2 * scale}
                />
                <ellipse cx="0" cy={22 * scale} rx={48 * scale} ry={13 * scale} fill="#2d3748" />
                <line x1={45 * scale} y1="0" x2={75 * scale} y2={45 * scale} stroke="#ecc94b" strokeWidth={4 * scale} />
                <motion.circle
                    cx={78 * scale}
                    cy={50 * scale}
                    r={9 * scale}
                    fill="#ecc94b"
                    animate={{ y: [0, 5 * scale, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </g>

            {/* LAYER 5: Face */}
            <ellipse cx={centerX - 65 * scale} cy={headY + 30 * scale} rx={15 * scale} ry={10 * scale} fill="#f9a8d4" opacity="0.5" />
            <ellipse cx={centerX + 65 * scale} cy={headY + 30 * scale} rx={15 * scale} ry={10 * scale} fill="#f9a8d4" opacity="0.5" />

            {/* Left Eye */}
            <g transform={`translate(${centerX - 35 * scale}, ${headY})`}>
                <ellipse cx="0" cy="0" rx={24 * scale} ry={28 * scale} fill="white" />
                <motion.circle
                    cx="0"
                    cy="0"
                    r={12 * scale}
                    fill="#2d3748"
                    animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                />
                <circle cx={-4 * scale} cy={-7 * scale} r={5 * scale} fill="white" opacity="0.9" />
            </g>

            {/* Right Eye */}
            <g transform={`translate(${centerX + 35 * scale}, ${headY})`}>
                <ellipse cx="0" cy="0" rx={24 * scale} ry={28 * scale} fill="white" />
                <motion.circle
                    cx="0"
                    cy="0"
                    r={12 * scale}
                    fill="#2d3748"
                    animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                />
                <circle cx={-4 * scale} cy={-7 * scale} r={5 * scale} fill="white" opacity="0.9" />
            </g>

            {/* Smile */}
            <path
                d={`M${centerX - 30 * scale} ${headY + 45 * scale} Q${centerX} ${headY + 68 * scale} ${centerX + 30 * scale} ${headY + 45 * scale}`}
                stroke="#553c9a"
                strokeWidth={5 * scale}
                strokeLinecap="round"
                fill="none"
            />
        </motion.svg>
    );
};

export const OctopusMascot = () => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive scaling based on container width
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                // Base width is 800px, scale down for smaller screens
                const newScale = Math.min(containerWidth / 800, 1);
                setScale(Math.max(newScale, 0.4)); // Minimum scale of 0.4
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    const iconPositions = getIconPositions(scale);

    return (
        <div
            ref={containerRef}
            className="relative w-full max-w-[800px] flex items-center justify-center"
            style={{ height: `${520 * scale}px` }}
        >
            {/* Animated SVG Octopus */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <AnimatedOctopus scale={scale} />
            </div>

            {/* Interactive Icons at tentacle ends */}
            {tentacleItems.map((item, index) => {
                const pos = iconPositions[index];
                const isHovered = hoveredItem === item.label;

                // Responsive icon size
                const iconContainerSize = Math.max(40, 56 * scale);
                const iconSize = Math.max(16, 24 * scale);

                return (
                    <Link key={item.label} href={item.href} legacyBehavior>
                        <motion.a
                            className="absolute flex flex-col items-center gap-1 cursor-pointer z-20"
                            style={{
                                left: pos.x - iconContainerSize / 2,
                                top: pos.y - iconContainerSize / 2,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: 1,
                                scale: isHovered ? 1.15 : 1,
                            }}
                            transition={{
                                delay: index * 0.05,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={() => setHoveredItem(item.label)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onTouchStart={() => setHoveredItem(item.label)}
                            onTouchEnd={() => setTimeout(() => setHoveredItem(null), 1500)}
                        >
                            {/* Glowing Circle */}
                            <motion.div
                                className="rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300"
                                style={{
                                    width: iconContainerSize,
                                    height: iconContainerSize,
                                    background: isHovered
                                        ? `linear-gradient(135deg, ${item.color}40, ${item.color}20)`
                                        : 'rgba(30, 30, 50, 0.8)',
                                    border: `2px solid ${isHovered ? item.color : 'rgba(255,255,255,0.2)'}`,
                                    boxShadow: isHovered
                                        ? `0 0 20px ${item.color}, 0 0 40px ${item.color}40`
                                        : '0 4px 15px rgba(0,0,0,0.3)',
                                }}
                            >
                                <item.icon
                                    style={{
                                        width: iconSize,
                                        height: iconSize,
                                        color: item.color,
                                        filter: isHovered ? `drop-shadow(0 0 6px ${item.color})` : 'none'
                                    }}
                                />
                            </motion.div>

                            {/* Label - Shows on Hover/Touch */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.span
                                        initial={{ opacity: 0, y: -5, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -5, scale: 0.8 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-md"
                                        style={{
                                            top: iconContainerSize + 4,
                                            color: item.color,
                                            background: 'rgba(30, 30, 50, 0.9)',
                                            border: `1px solid ${item.color}50`,
                                            boxShadow: `0 0 10px ${item.color}30`
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

            {/* Settings Button - Fixed in Bottom Right Corner (outside tentacles) */}
            <Link href="/settings" legacyBehavior>
                <motion.a
                    className="fixed bottom-6 right-6 md:bottom-8 md:right-8 flex flex-col items-center gap-1 cursor-pointer z-50"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: hoveredItem === "Settings" ? 1.1 : 1 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHoveredItem("Settings")}
                    onMouseLeave={() => setHoveredItem(null)}
                >
                    <motion.div
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300"
                        style={{
                            background: hoveredItem === "Settings"
                                ? 'linear-gradient(135deg, var(--accent-orange)40, var(--accent-orange)20)'
                                : 'rgba(30, 30, 50, 0.9)',
                            border: `2px solid ${hoveredItem === "Settings" ? 'var(--accent-orange)' : 'rgba(255,255,255,0.2)'}`,
                            boxShadow: hoveredItem === "Settings"
                                ? '0 0 25px var(--accent-orange), 0 0 50px var(--accent-orange)40'
                                : '0 4px 20px rgba(0,0,0,0.4)',
                        }}
                    >
                        <Settings
                            className="w-5 h-5 md:w-6 md:h-6"
                            style={{
                                color: 'var(--accent-orange)',
                                filter: hoveredItem === "Settings" ? 'drop-shadow(0 0 6px var(--accent-orange))' : 'none'
                            }}
                        />
                    </motion.div>
                    <AnimatePresence>
                        {hoveredItem === "Settings" && (
                            <motion.span
                                initial={{ opacity: 0, y: -5, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-md"
                                style={{
                                    color: 'var(--accent-orange)',
                                    background: 'rgba(30, 30, 50, 0.9)',
                                    border: '1px solid var(--accent-orange)50',
                                    boxShadow: '0 0 10px var(--accent-orange)30'
                                }}
                            >
                                Settings
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.a>
            </Link>
        </div>
    );
};

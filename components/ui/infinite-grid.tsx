"use client";

import React, { useRef } from "react";
import {
    motion,
    useMotionValue,
    useMotionTemplate,
    useAnimationFrame,
} from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard Shadcn utility for merging Tailwind classes safely.
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Helper component for the SVG grid pattern.
 */
const GridPattern = ({
    offsetX,
    offsetY,
    size,
}: {
    offsetX: any;
    offsetY: any;
    size: number;
}) => {
    return (
        <svg className="w-full h-full">
            <defs>
                <motion.pattern
                    id="grid-pattern"
                    width={size}
                    height={size}
                    patternUnits="userSpaceOnUse"
                    x={offsetX}
                    y={offsetY}
                >
                    <path
                        d={`M ${size} 0 L 0 0 0 ${size}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-muted-foreground"
                    />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
    );
};

interface InfiniteGridProps {
    children?: React.ReactNode;
    gridSize?: number;
    className?: string;
}

/**
 * The Infinite Grid Component
 * Displays a scrolling background grid that reveals an active layer on mouse hover.
 */
export const InfiniteGrid = ({
    children,
    gridSize = 50,
    className,
}: InfiniteGridProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track mouse position with Motion Values for performance (avoids React re-renders)
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    };

    // Grid offsets for infinite scroll animation
    const gridOffsetX = useMotionValue(0);
    const gridOffsetY = useMotionValue(0);

    const speedX = 0.3;
    const speedY = 0.3;

    useAnimationFrame(() => {
        const currentX = gridOffsetX.get();
        const currentY = gridOffsetY.get();
        // Reset offset at pattern width to simulate infinity
        gridOffsetX.set((currentX + speedX) % gridSize);
        gridOffsetY.set((currentY + speedY) % gridSize);
    });

    // Create a dynamic radial mask for the "flashlight" effect
    const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className={cn(
                "relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background",
                className
            )}
        >
            {/* Layer 1: Subtle background grid (always visible) */}
            <div className="absolute inset-0 z-0 opacity-[0.03]">
                <GridPattern
                    offsetX={gridOffsetX}
                    offsetY={gridOffsetY}
                    size={gridSize}
                />
            </div>

            {/* Layer 2: Highlighted grid (revealed by mouse mask) */}
            <motion.div
                className="absolute inset-0 z-0 opacity-30"
                style={{ maskImage, WebkitMaskImage: maskImage }}
            >
                <GridPattern
                    offsetX={gridOffsetX}
                    offsetY={gridOffsetY}
                    size={gridSize}
                />
            </motion.div>

            {/* Decorative Blur Spheres - Using Astro theme colors */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute right-[-15%] top-[-15%] w-[35%] h-[35%] rounded-full bg-accent-purple/30 blur-[100px]" />
                <div className="absolute right-[15%] top-[-5%] w-[15%] h-[15%] rounded-full bg-accent-blue/25 blur-[80px]" />
                <div className="absolute left-[-10%] bottom-[-15%] w-[35%] h-[35%] rounded-full bg-accent-blue/25 blur-[100px]" />
                <div className="absolute left-[20%] bottom-[10%] w-[20%] h-[20%] rounded-full bg-accent-purple/20 blur-[80px]" />
            </div>

            {/* Content */}
            {children}
        </div>
    );
};

export default InfiniteGrid;

"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InfiniteGridProps {
    children?: React.ReactNode;
    gridSize?: number;
    className?: string;
}

export const InfiniteGrid = ({
    children,
    gridSize = 50,
    className,
}: InfiniteGridProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // Only enable mouse tracking after mount to prevent hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    // Track mouse position with Motion Values
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!mounted) return;
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    };

    // Create a dynamic radial mask for the "flashlight" effect
    const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

    // CSS-based grid pattern (more stable than SVG)
    const gridPatternStyle = {
        backgroundImage: `
            linear-gradient(to right, rgba(128, 128, 128, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(128, 128, 128, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
    };

    const gridPatternHighlight = {
        backgroundImage: `
            linear-gradient(to right, rgba(128, 128, 128, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(128, 128, 128, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className={cn(
                "relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background",
                className
            )}
        >
            {/* Layer 1: Subtle background grid (CSS-based, always visible) */}
            <div
                className="absolute inset-0 z-0"
                style={gridPatternStyle}
            />

            {/* Layer 2: Highlighted grid (revealed by mouse mask) */}
            {mounted && (
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{
                        ...gridPatternHighlight,
                        maskImage,
                        WebkitMaskImage: maskImage
                    }}
                />
            )}

            {/* Decorative Blur Spheres */}
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

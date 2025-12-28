"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export const AstroMascot = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const eyeRef = useRef<SVGGElement>(null);
    const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        if (!eyeRef.current) return;

        const eyeRect = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;

        const deltaX = mousePosition.x - eyeCenterX;
        const deltaY = mousePosition.y - eyeCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 10); // Limit pupil movement radius

        setPupilOffset({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
        });
    }, [mousePosition]);

    return (
        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-64 h-64 flex items-center justify-center"
        >
            <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_15px_rgba(177,156,217,0.5)] dark:drop-shadow-[0_0_20px_rgba(177,156,217,0.8)]"
            >
                {/* Face Shape - Minimalist Outline */}
                <path
                    d="M40 100C40 66.8629 66.8629 40 100 40C133.137 40 160 66.8629 160 100C160 133.137 133.137 160 100 160C66.8629 160 40 133.137 40 100Z"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-foreground"
                />

                {/* Left Eye */}
                <g transform="translate(75, 90)" ref={eyeRef}>
                    <circle cx="0" cy="0" r="12" className="fill-foreground/10 dark:fill-foreground/20" />
                    <motion.circle
                        cx="0"
                        cy="0"
                        r="6"
                        animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        className="fill-foreground"
                    />
                </g>

                {/* Right Eye */}
                <g transform="translate(125, 90)">
                    <circle cx="0" cy="0" r="12" className="fill-foreground/10 dark:fill-foreground/20" />
                    <motion.circle
                        cx="0"
                        cy="0"
                        r="6"
                        animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        className="fill-foreground"
                    />
                </g>

                {/* Smile - Cute & Minimalist */}
                <path
                    d="M85 120C85 120 92 130 100 130C108 130 115 120 115 120"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="text-foreground"
                />
            </svg>
        </motion.div>
    );
};

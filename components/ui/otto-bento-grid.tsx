"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    MessageCircle,
    Calendar,
    CheckSquare,
    FileText,
    Lightbulb,
    Star,
    Network,
    Settings,
    Sparkles,
} from "lucide-react";

// Typing animation for Chat card
function ChatPreview() {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 400);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-2 h-full justify-center">
            <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-accent-purple/50 flex items-center justify-center">
                    <Sparkles size={12} className="text-accent-purple" />
                </div>
                <div className="flex-1 bg-white/10 rounded-xl rounded-bl-sm p-2">
                    <span className="text-xs text-white/80">Olá! Como posso ajudar?</span>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <div className="bg-accent-blue/30 rounded-xl rounded-br-sm p-2 max-w-[70%]">
                    <span className="text-xs text-white/80">
                        Digitando{dots}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Calendar preview animation
function CalendarPreview() {
    const [activeDay, setActiveDay] = useState(15);
    const days = Array.from({ length: 7 }, (_, i) => 14 + i);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDay((prev) => (prev >= 20 ? 14 : prev + 1));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex gap-1 justify-center items-center h-full">
            {days.map((day) => (
                <motion.div
                    key={day}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${day === activeDay
                        ? "bg-accent-purple text-background"
                        : "bg-white/10 text-white/60"
                        }`}
                    animate={{ scale: day === activeDay ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {day}
                </motion.div>
            ))}
        </div>
    );
}

// Tasks progress animation
function TasksPreview() {
    const [completed, setCompleted] = useState(2);

    useEffect(() => {
        const interval = setInterval(() => {
            setCompleted((prev) => (prev >= 4 ? 0 : prev + 1));
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-1.5 h-full justify-center">
            {[0, 1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="flex items-center gap-2"
                    animate={{ opacity: i <= completed ? 1 : 0.4 }}
                >
                    <motion.div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${i < completed
                            ? "bg-accent-green border-accent-green"
                            : "border-white/30"
                            }`}
                        animate={{ scale: i === completed - 1 ? [1, 1.2, 1] : 1 }}
                    >
                        {i < completed && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-[8px] text-background"
                            >
                                ✓
                            </motion.span>
                        )}
                    </motion.div>
                    <div
                        className={`h-2 rounded-full flex-1 ${i < completed ? "bg-accent-green/50" : "bg-white/10"
                            }`}
                    />
                </motion.div>
            ))}
        </div>
    );
}

// Notes typing animation
function NotesPreview() {
    const lines = ["Ideias para o projeto...", "• Pesquisar sobre IA", "• Criar protótipo"];
    const [currentLine, setCurrentLine] = useState(0);
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        const text = lines[currentLine];
        let charIndex = 0;

        const typeInterval = setInterval(() => {
            if (charIndex <= text.length) {
                setDisplayedText(text.slice(0, charIndex));
                charIndex++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    setCurrentLine((prev) => (prev + 1) % lines.length);
                    setDisplayedText("");
                }, 1000);
            }
        }, 50);

        return () => clearInterval(typeInterval);
    }, [currentLine]);

    return (
        <div className="flex flex-col gap-1 h-full justify-center font-mono">
            <div className="text-xs text-white/80 min-h-[1.5em]">
                {displayedText}
                <span className="animate-pulse">|</span>
            </div>
        </div>
    );
}

// Ideas lightbulb animation
function IdeasPreview() {
    const [isLit, setIsLit] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsLit((prev) => !prev);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-center h-full relative">
            <motion.div
                animate={{
                    scale: isLit ? 1.1 : 1,
                    filter: isLit ? "drop-shadow(0 0 20px rgba(253, 253, 150, 0.8))" : "none",
                }}
                transition={{ duration: 0.5 }}
            >
                <Lightbulb
                    size={40}
                    className={isLit ? "text-accent-yellow" : "text-white/30"}
                    fill={isLit ? "currentColor" : "none"}
                />
            </motion.div>
            <AnimatePresence>
                {isLit && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        {[
                            { x: 20, y: 30 },
                            { x: 80, y: 25 },
                            { x: 15, y: 70 },
                            { x: 85, y: 65 },
                            { x: 50, y: 15 },
                        ].map((pos, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-accent-yellow rounded-full"
                                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0],
                                }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Graph network animation
function GraphPreview() {
    const nodes = [
        { x: 30, y: 30 },
        { x: 70, y: 25 },
        { x: 50, y: 60 },
        { x: 20, y: 70 },
        { x: 80, y: 65 },
    ];

    const [activeNode, setActiveNode] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveNode((prev) => (prev + 1) % nodes.length);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full">
            <svg className="absolute inset-0 w-full h-full">
                {nodes.map((node, i) =>
                    nodes.slice(i + 1).map((target, j) => (
                        <motion.line
                            key={`${i}-${j}`}
                            x1={`${node.x}%`}
                            y1={`${node.y}%`}
                            x2={`${target.x}%`}
                            y2={`${target.y}%`}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                            animate={{
                                stroke:
                                    i === activeNode || i + j + 1 === activeNode
                                        ? "rgba(177, 156, 217, 0.5)"
                                        : "rgba(255,255,255,0.1)",
                            }}
                        />
                    ))
                )}
            </svg>
            {nodes.map((node, i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
                    animate={{
                        scale: i === activeNode ? 1.5 : 1,
                        backgroundColor: i === activeNode ? "rgb(177, 156, 217)" : "rgba(255,255,255,0.3)",
                    }}
                />
            ))}
        </div>
    );
}

interface BentoCardProps {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    gradient?: string;
}

function BentoCard({
    href,
    title,
    description,
    icon,
    children,
    className = "",
    gradient = "from-accent-purple/20 to-accent-blue/20",
}: BentoCardProps) {
    return (
        <Link href={href}>
            <motion.div
                className={`group relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 flex flex-col overflow-hidden cursor-pointer transition-colors hover:border-accent-purple/50 ${className}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                {/* Background gradient on hover */}
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10 flex-1">{children}</div>

                {/* Footer */}
                <div className="relative z-10 mt-3 flex items-center gap-2">
                    <div className="text-accent-purple">{icon}</div>
                    <div>
                        <h3 className="font-medium text-foreground text-sm">{title}</h3>
                        <p className="text-muted-foreground text-xs">{description}</p>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

export function OttoBentoGrid() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl mx-auto">
            {/* Chat - Large */}
            <BentoCard
                href="/chat"
                title="Chat"
                description="Converse com Otto"
                icon={<MessageCircle size={16} />}
                className="col-span-2 row-span-2 min-h-[200px] md:min-h-[240px]"
                gradient="from-accent-purple/30 to-accent-blue/20"
            >
                <ChatPreview />
            </BentoCard>

            {/* Calendar */}
            <BentoCard
                href="/calendar"
                title="Calendário"
                description="Organize seu tempo"
                icon={<Calendar size={16} />}
                className="col-span-2 min-h-[120px]"
                gradient="from-accent-blue/30 to-accent-purple/10"
            >
                <CalendarPreview />
            </BentoCard>

            {/* Tasks */}
            <BentoCard
                href="/tasks"
                title="Tarefas"
                description="Gerencie atividades"
                icon={<CheckSquare size={16} />}
                className="min-h-[120px]"
                gradient="from-accent-green/30 to-accent-blue/10"
            >
                <TasksPreview />
            </BentoCard>

            {/* Notes */}
            <BentoCard
                href="/notes"
                title="Notas"
                description="Anote ideias"
                icon={<FileText size={16} />}
                className="min-h-[120px]"
                gradient="from-accent-yellow/20 to-accent-purple/10"
            >
                <NotesPreview />
            </BentoCard>

            {/* Ideas */}
            <BentoCard
                href="/ideas"
                title="Ideias"
                description="Capture inspirações"
                icon={<Lightbulb size={16} />}
                className="min-h-[120px]"
                gradient="from-accent-yellow/30 to-accent-orange/20"
            >
                <IdeasPreview />
            </BentoCard>

            {/* Cadernos (Graph) */}
            <BentoCard
                href="/cadernos"
                title="Cadernos"
                description="Grafo de conhecimento"
                icon={<Network size={16} />}
                className="min-h-[120px]"
                gradient="from-accent-purple/30 to-accent-blue/20"
            >
                <GraphPreview />
            </BentoCard>

            {/* Favorites */}
            <BentoCard
                href="/favorites"
                title="Favoritos"
                description="Itens salvos"
                icon={<Star size={16} />}
                className="min-h-[100px]"
                gradient="from-accent-yellow/30 to-accent-purple/10"
            >
                <div className="flex items-center justify-center h-full">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Star size={32} className="text-accent-yellow" fill="currentColor" />
                    </motion.div>
                </div>
            </BentoCard>

            {/* Settings */}
            <BentoCard
                href="/settings"
                title="Configurações"
                description="Personalize"
                icon={<Settings size={16} />}
                className="min-h-[100px]"
                gradient="from-muted/50 to-muted/20"
            >
                <div className="flex items-center justify-center h-full">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <Settings size={32} className="text-muted-foreground" />
                    </motion.div>
                </div>
            </BentoCard>
        </div>
    );
}

export default OttoBentoGrid;

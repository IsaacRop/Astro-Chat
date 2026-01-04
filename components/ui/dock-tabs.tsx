"use client"

import { useState, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import {
    MessageCircle,
    Calendar,
    CheckSquare,
    FileText,
    Lightbulb,
    Star,
    Network,
    Settings,
    Home,
} from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DockItem {
    id: string
    name: string
    icon: React.ReactNode
    colorClass: string
    href: string
}

// Colors matching the home page accent colors
const dockItems: DockItem[] = [
    { id: "home", name: "Início", icon: <Home className="w-5 h-5" />, colorClass: "text-accent-purple", href: "/" },
    { id: "chat", name: "Chat", icon: <MessageCircle className="w-5 h-5" />, colorClass: "text-accent-purple", href: "/chat" },
    { id: "cadernos", name: "Cadernos", icon: <Network className="w-5 h-5" />, colorClass: "text-accent-purple", href: "/cadernos" },
    { id: "calendar", name: "Calendário", icon: <Calendar className="w-5 h-5" />, colorClass: "text-accent-blue", href: "/calendar" },
    { id: "tasks", name: "Tarefas", icon: <CheckSquare className="w-5 h-5" />, colorClass: "text-accent-green", href: "/tasks" },
    { id: "notes", name: "Notas", icon: <FileText className="w-5 h-5" />, colorClass: "text-accent-blue", href: "/notes" },
    { id: "ideas", name: "Ideias", icon: <Lightbulb className="w-5 h-5" />, colorClass: "text-accent-yellow", href: "/ideas" },
    { id: "favorites", name: "Favoritos", icon: <Star className="w-5 h-5" />, colorClass: "text-accent-yellow", href: "/favorites" },
    { id: "settings", name: "Configurações", icon: <Settings className="w-5 h-5" />, colorClass: "text-accent-orange", href: "/settings" },
]

function DockIcon({ item, mouseX, isActive }: { item: DockItem; mouseX: ReturnType<typeof useMotionValue<number>>; isActive: boolean }) {
    const ref = useRef<HTMLDivElement>(null)

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
        return val - bounds.x - bounds.width / 2
    })

    const widthSync = useTransform(distance, [-100, 0, 100], [40, 56, 40])
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

    const heightSync = useTransform(distance, [-100, 0, 100], [40, 56, 40])
    const height = useSpring(heightSync, { mass: 0.1, stiffness: 150, damping: 12 })

    const [isHovered, setIsHovered] = useState(false)
    const [isClicked, setIsClicked] = useState(false)

    return (
        <Link href={item.href}>
            <motion.div
                ref={ref}
                style={{ width, height }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={() => setIsClicked(true)}
                onMouseUp={() => setIsClicked(false)}
                className="aspect-square cursor-pointer flex items-center justify-center relative group"
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    className={`w-full h-full rounded-xl shadow-md flex items-center justify-center relative overflow-hidden backdrop-blur-sm transition-all duration-200 ${item.colorClass} ${isActive
                            ? 'bg-current/20 border-2 border-current shadow-lg scale-110'
                            : 'bg-card/80 border border-border/50'
                        } ${isHovered && !isActive ? 'border-current shadow-lg' : ''}`}
                    animate={{
                        y: isClicked ? 1 : isHovered ? -4 : 0,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                    }}
                >
                    <motion.div
                        className={item.colorClass}
                        animate={{
                            scale: isHovered ? 1.15 : isActive ? 1.1 : 1,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                        }}
                    >
                        {item.icon}
                    </motion.div>

                    {/* Shine effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"
                        animate={{
                            opacity: isHovered || isActive ? 0.2 : 0.05,
                        }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.div>

                {/* Tooltip */}
                <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        y: isHovered ? 50 : 5,
                        scale: isHovered ? 1 : 0.9,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                    }}
                    className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-card/95 text-foreground text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none backdrop-blur-sm border border-border/50 shadow-lg z-50"
                >
                    {item.name}
                </motion.div>

                {/* Active indicator dot */}
                {isActive && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full ${item.colorClass} bg-current`}
                    />
                )}
            </motion.div>
        </Link>
    )
}

export function DockTabs() {
    const mouseX = useMotionValue(Infinity)
    const pathname = usePathname()

    // Check if the current path matches the item's href
    const isItemActive = (href: string) => {
        if (href === "/") {
            return pathname === "/"
        }
        return pathname.startsWith(href)
    }

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex h-14 items-center gap-1.5 rounded-2xl bg-background/60 backdrop-blur-xl px-2 border border-border/40 shadow-lg"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
            }}
        >
            {dockItems.map((item) => (
                <DockIcon
                    key={item.id}
                    item={item}
                    mouseX={mouseX}
                    isActive={isItemActive(item.href)}
                />
            ))}
        </motion.div>
    )
}

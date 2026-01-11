"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, MessageCircle, Network, Calendar, CheckSquare, FileText, Lightbulb, Star, Settings } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

interface NavItem {
    id: string
    name: string
    icon: React.ReactNode
    href: string
    colorClass: string
}

const navItems: NavItem[] = [
    { id: "home", name: "Início", icon: <Home className="w-5 h-5" />, href: "/", colorClass: "text-accent-purple" },
    { id: "chat", name: "Chat", icon: <MessageCircle className="w-5 h-5" />, href: "/chat", colorClass: "text-accent-purple" },
    { id: "cadernos", name: "Cadernos", icon: <Network className="w-5 h-5" />, href: "/cadernos", colorClass: "text-accent-purple" },
    { id: "calendar", name: "Calendário", icon: <Calendar className="w-5 h-5" />, href: "/calendar", colorClass: "text-accent-blue" },
    { id: "tasks", name: "Tarefas", icon: <CheckSquare className="w-5 h-5" />, href: "/tasks", colorClass: "text-accent-green" },
    { id: "notes", name: "Notas", icon: <FileText className="w-5 h-5" />, href: "/notes", colorClass: "text-accent-blue" },
    { id: "ideas", name: "Ideias", icon: <Lightbulb className="w-5 h-5" />, href: "/ideas", colorClass: "text-accent-yellow" },
    { id: "favorites", name: "Favoritos", icon: <Star className="w-5 h-5" />, href: "/favorites", colorClass: "text-accent-yellow" },
    { id: "settings", name: "Configurações", icon: <Settings className="w-5 h-5" />, href: "/settings", colorClass: "text-accent-orange" },
]

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/"
        return pathname.startsWith(href)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Abrir menu de navegação"
                >
                    <Menu size={22} />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-background/95 backdrop-blur-xl border-r border-border/50 p-0">
                <SheetHeader className="p-4 pb-2 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2 text-foreground">
                        {/* Octopus Icon */}
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-accent-purple">
                            <ellipse cx="12" cy="8" rx="7" ry="6" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="9" cy="7" r="1.5" fill="currentColor" />
                            <circle cx="15" cy="7" r="1.5" fill="currentColor" />
                        </svg>
                        <span className="font-serif font-bold">Otto</span>
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 p-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 min-h-[44px] ${isActive(item.href)
                                    ? `bg-current/10 ${item.colorClass}`
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            <span className={isActive(item.href) ? item.colorClass : ""}>
                                {item.icon}
                            </span>
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    )
}

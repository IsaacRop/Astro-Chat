"use client"

import { useState } from "react"
import { List } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

interface ChatSession {
    id: string
    title: string | null
    updated_at: string
}

interface MobileChatSidebarProps {
    chats: ChatSession[]
}

export function MobileChatSidebar({ chats }: MobileChatSidebarProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-zinc-200 transition-colors border border-white/[0.05]"
                    aria-label="Histórico de conversas"
                >
                    <List size={18} />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-[#1A1A1C] border-r border-white/[0.05]">
                <SheetHeader className="sr-only">
                    <SheetTitle>Histórico de Conversas</SheetTitle>
                </SheetHeader>
                <div onClick={() => setOpen(false)}>
                    <ChatSidebar chats={chats} className="border-none" />
                </div>
            </SheetContent>
        </Sheet>
    )
}

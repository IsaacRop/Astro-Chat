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
                    className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg bg-[#EDF4EF] hover:bg-[#DFF0E5] text-[#5A7565] hover:text-[#1E2E25] transition-colors border border-[#E2EDE6]"
                    aria-label="Histórico de conversas"
                >
                    <List size={18} />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-white border-r border-[#E2EDE6]">
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

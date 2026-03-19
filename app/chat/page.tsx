"use client";

import dynamic from "next/dynamic";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { getUserChats } from "@/app/actions/chat";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const ChatInterface = dynamic(
    () => import("@/components/chat-interface").then((m) => ({ default: m.ChatInterface })),
    { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center bg-background"><div className="text-muted-foreground animate-pulse text-sm">Carregando chat...</div></div> }
);

export default function ChatPage() {
    const [chats, setChats] = useState<any[]>([]);

    useEffect(() => {
        getUserChats().then(setChats);
    }, []);

    return (
        <div className="flex h-full min-h-0">
            <ChatSidebar chats={chats} className="hidden md:flex" />
            <ChatInterface chatId={null} initialMessages={[]} />
        </div>
    );
}

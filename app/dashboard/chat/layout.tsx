import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserChats } from "@/app/actions/chat";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { MobileChatSidebar } from "@/components/chat/mobile-chat-sidebar";
import { Header } from "@/components/Header";

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const chats = await getUserChats();

    return (
        <div className="flex w-full h-screen bg-[#0C0C0D] overflow-hidden">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block h-full">
                <ChatSidebar chats={chats || []} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Mobile chat history button - positioned after the hamburger menu */}
                <div className="absolute top-16 left-3 z-20 md:hidden">
                    <MobileChatSidebar chats={chats || []} />
                </div>
                {children}
            </div>
        </div>
    );
}

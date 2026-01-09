import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserChats } from "@/app/actions/chat";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
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
            {/* Sidebar - Hidden on mobile, handled by mobile controls if needed, 
                but for now we focus on desktop structure or basic responsive hiding */}
            <div className="hidden md:block h-full">
                <ChatSidebar chats={chats || []} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {children}
            </div>
        </div>
    );
}

import { getChatMessages, getUserChats } from "@/app/actions/chat";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInterface } from "@/components/chat-interface";

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [messages, chats] = await Promise.all([
        getChatMessages(id),
        getUserChats(),
    ]);

    const formattedMessages = messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
    }));

    return (
        <div className="flex h-full min-h-0">
            <ChatSidebar chats={chats} className="hidden md:flex" />
            <ChatInterface chatId={id} initialMessages={formattedMessages} />
        </div>
    );
}

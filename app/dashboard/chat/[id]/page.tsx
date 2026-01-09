import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { getChatMessages } from "@/app/actions/chat";

interface ChatPageProps {
    params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
    const { id: chatId } = await params;

    console.log("[ChatPage] Loading chat:", chatId);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log("[ChatPage] No user, redirecting to home");
        redirect("/");
    }

    // Verify chat exists and belongs to user
    const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("id, user_id, title")
        .eq("id", chatId)
        .single();

    if (chatError || !chat) {
        console.error("[ChatPage] Chat not found:", chatError?.message);
        notFound();
    }

    // Security check: Ensure chat belongs to current user
    if (chat.user_id !== user.id) {
        console.error("[ChatPage] Chat belongs to different user");
        redirect("/dashboard");
    }

    console.log("[ChatPage] ✓ Chat verified, loading messages");

    // Fetch messages for this chat
    const messages = await getChatMessages(chatId);
    console.log("[ChatPage] Loaded", messages.length, "messages");

    // Format messages for the client component
    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
    }));

    return <ChatInterface chatId={chatId} initialMessages={formattedMessages} />;
}

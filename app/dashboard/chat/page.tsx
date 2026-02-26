import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/chat-interface";

/**
 * Chat Index Page — renders a fresh ChatInterface with chatId=null.
 * The chat row is only created in the DB when the user sends their first message.
 */
export default function ChatIndexPage() {
    return <ChatInterface chatId={null} initialMessages={[]} />;
}

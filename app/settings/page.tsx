import { getUserUsage } from "@/app/actions/usage";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
    const [chatUsage, examUsage, flashcardUsage] = await Promise.all([
        getUserUsage("chat"),
        getUserUsage("exam"),
        getUserUsage("flashcard"),
    ]);

    return (
        <SettingsClient
            chatUsage={chatUsage}
            examUsage={examUsage}
            flashcardUsage={flashcardUsage}
        />
    );
}

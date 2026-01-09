"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
    MessageCircle,
    Calendar,
    CheckSquare,
    FileText,
    Lightbulb,
    Star,
    Network,
    Settings,
} from "lucide-react";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import { createNewChat, createNewNote } from "@/app/actions/dashboard";

interface DashboardGridProps {
    isLoggedIn: boolean;
}

export function DashboardGrid({ isLoggedIn }: DashboardGridProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loadingItem, setLoadingItem] = useState<string | null>(null);

    const handleChatClick = () => {
        if (!isLoggedIn) {
            router.push("/chat");
            return;
        }

        setLoadingItem("chat");
        startTransition(async () => {
            try {
                const { id } = await createNewChat();
                router.push(`/dashboard/chat/${id}`);
            } catch (error) {
                console.error("Failed to create chat:", error);
                // Fallback to regular chat
                router.push("/chat");
            } finally {
                setLoadingItem(null);
            }
        });
    };

    const handleNotesClick = () => {
        if (!isLoggedIn) {
            router.push("/notes");
            return;
        }

        setLoadingItem("notes");
        startTransition(async () => {
            try {
                const { id } = await createNewNote();
                router.push(`/dashboard/notes/${id}`);
            } catch (error) {
                console.error("Failed to create note:", error);
                router.push("/notes");
            } finally {
                setLoadingItem(null);
            }
        });
    };

    const bentoItems: BentoItem[] = [
        // Row 1
        {
            title: "Chat",
            description: "Converse com Otto, assistente inteligente",
            icon: <MessageCircle size={22} />,
            status: "Online",
            onClick: handleChatClick,
            isLoading: loadingItem === "chat",
            colSpan: 3,
            hasPersistentHover: true,
            tags: ["AI", "GPT-4"],
            cta: "Conversar"
        },
        {
            title: "Cadernos",
            description: "Grafo de conhecimento",
            icon: <Network size={22} />,
            href: "/cadernos",
            colSpan: 3,
            tags: ["Grafo"],
        },

        // Row 2
        {
            title: "Notas",
            description: "Editor Markdown",
            icon: <FileText size={22} />,
            onClick: handleNotesClick,
            isLoading: loadingItem === "notes",
            colSpan: 2,
            tags: ["Editor"],
        },
        {
            title: "Ideias",
            description: "Capture inspirações",
            icon: <Lightbulb size={22} />,
            href: "/ideas",
            colSpan: 2,
        },
        {
            title: "Favoritos",
            description: "Itens salvos",
            icon: <Star size={22} />,
            href: "/favorites",
            colSpan: 2,
        },

        // Row 3
        {
            title: "Tarefas",
            description: "Kanban Board",
            icon: <CheckSquare size={22} />,
            href: "/tasks",
            colSpan: 3,
            tags: ["Produtividade"],
        },
        {
            title: "Calendário",
            description: "Eventos e prazos",
            icon: <Calendar size={22} />,
            href: "/calendar",
            colSpan: 3,
            tags: ["Agenda"],
        },

        // Row 4
        {
            title: "Configurações",
            description: "Personalização",
            icon: <Settings size={22} />,
            href: "/settings",
            colSpan: 6,
        },
    ];

    return <BentoGrid items={bentoItems} />;
}

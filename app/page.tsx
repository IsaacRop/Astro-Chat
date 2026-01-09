import {
  MessageCircle,
  Calendar,
  CheckSquare,
  FileText,
  Lightbulb,
  Star,
  Network,
  Settings,
  ArrowRight,
} from "lucide-react";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import { LoginButton } from "@/components/LoginButton";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const bentoItems: BentoItem[] = [
    // Row 1
    {
      title: "Chat",
      description: "Converse com Otto, assistente inteligente",
      icon: <MessageCircle size={22} />,
      status: "Online",
      href: "/chat",
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
      href: "/notes",
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

  return (
    <div className="h-screen md:h-screen w-full bg-[#0C0C0D] flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Content Container */}
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 h-full relative z-10">

        {/* Header Section - Compact */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#1A1A1C] border border-white/[0.05] px-6 py-6 md:px-8 md:py-8 flex flex-row items-center justify-between shrink-0">
          <div className="relative z-10 flex items-baseline gap-4">
            <h1 className="text-3xl md:text-3xl font-serif text-white/90 tracking-tighter">
              Otto
            </h1>
            <p className="text-zinc-500 text-sm font-sans hidden md:block">
              Assistente de IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!user ? (
              <LoginButton />
            ) : (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300"
              >
                <span className="text-sm font-medium text-zinc-200 group-hover:text-white">Ir para meu Painel</span>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
              </Link>
            )}
          </div>
        </div>

        {/* Bento Grid - Fills remaining space */}
        <div className="flex-1 min-h-0">
          <BentoGrid items={bentoItems} />
        </div>
      </div>
    </div>
  );
}

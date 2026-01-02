"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
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

// Octopus Icon - Large version for hero
const OctopusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-14 h-14 md:w-20 md:h-20 text-accent-purple"
  >
    <ellipse cx="12" cy="9" rx="6" ry="5" />
    <circle cx="10" cy="8" r="1" fill="currentColor" />
    <circle cx="14" cy="8" r="1" fill="currentColor" />
    <path d="M6 12 C4 14, 3 17, 4 19" />
    <path d="M8 13 C7 15, 6 18, 7 20" />
    <path d="M10 14 C10 16, 9 19, 10 21" />
    <path d="M14 14 C14 16, 15 19, 14 21" />
    <path d="M16 13 C17 15, 18 18, 17 20" />
    <path d="M18 12 C20 14, 21 17, 20 19" />
  </svg>
);

// Color variants for cards
const colorVariants = {
  purple: {
    icon: "text-accent-purple",
    glow: "shadow-accent-purple/20 hover:shadow-accent-purple/40",
    border: "hover:border-accent-purple/50",
    bg: "hover:bg-accent-purple/5",
  },
  blue: {
    icon: "text-accent-blue",
    glow: "shadow-accent-blue/20 hover:shadow-accent-blue/40",
    border: "hover:border-accent-blue/50",
    bg: "hover:bg-accent-blue/5",
  },
  green: {
    icon: "text-accent-green",
    glow: "shadow-accent-green/20 hover:shadow-accent-green/40",
    border: "hover:border-accent-green/50",
    bg: "hover:bg-accent-green/5",
  },
  yellow: {
    icon: "text-accent-yellow",
    glow: "shadow-accent-yellow/20 hover:shadow-accent-yellow/40",
    border: "hover:border-accent-yellow/50",
    bg: "hover:bg-accent-yellow/5",
  },
};

type ColorVariant = keyof typeof colorVariants;

// Card component with glow and color
function NavCard({
  href,
  title,
  description,
  icon: Icon,
  className = "",
  iconSize = 28,
  color = "purple",
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
  iconSize?: number;
  color?: ColorVariant;
}) {
  const variant = colorVariants[color];

  return (
    <Link
      href={href}
      className={`group relative bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg ${variant.glow} ${variant.border} ${variant.bg} ${className}`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-transparent via-transparent to-current pointer-events-none ${variant.icon}`} style={{ opacity: 0.03 }} />

      <div className="flex-1 flex items-center justify-center relative z-10">
        <Icon size={iconSize} className={`${variant.icon} group-hover:scale-110 transition-transform duration-300`} />
      </div>
      <div className="mt-3 relative z-10">
        <h3 className="font-medium text-foreground text-sm">{title}</h3>
        <p className="text-muted-foreground text-xs leading-tight">{description}</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-purple/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden px-4 py-6 md:px-8 md:py-8">
      {/* Decorative background with multiple glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute right-[-10%] top-[-10%] w-[40%] h-[40%] rounded-full bg-accent-purple/15 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-10%] w-[40%] h-[40%] rounded-full bg-accent-blue/15 blur-[100px]" />
        <div className="absolute left-[30%] top-[20%] w-[20%] h-[20%] rounded-full bg-accent-green/10 blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 w-full max-w-6xl mx-auto gap-4 px-4 py-4 md:px-8 md:py-6 overflow-auto">
        {/* Hero Header - Prominent with glow */}
        <div className="flex flex-col items-center text-center py-4 md:py-6">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 border border-accent-purple/30 flex items-center justify-center shadow-2xl shadow-accent-purple/30 mb-4">
            <OctopusIcon />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-accent-purple to-foreground drop-shadow-lg">
            Otto
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-2">
            Assistente de IA de Próxima Geração
          </p>
        </div>

        {/* Navigation Bento Grid with varied colors */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-3 auto-rows-fr">
          {/* Chat - Purple */}
          <NavCard
            href="/chat"
            title="Chat"
            description="Converse com Otto"
            icon={MessageCircle}
            className="col-span-2 row-span-2"
            iconSize={56}
            color="purple"
          />

          {/* Calendar - Blue */}
          <NavCard
            href="/calendar"
            title="Calendário"
            description="Organize seu tempo"
            icon={Calendar}
            className="col-span-2"
            iconSize={36}
            color="blue"
          />

          {/* Cadernos - Purple */}
          <NavCard
            href="/cadernos"
            title="Cadernos"
            description="Grafo de conhecimento"
            icon={Network}
            className="col-span-2 row-span-2"
            iconSize={56}
            color="purple"
          />

          {/* Tasks - Green */}
          <NavCard
            href="/tasks"
            title="Tarefas"
            description="Gerencie atividades"
            icon={CheckSquare}
            iconSize={32}
            color="green"
          />

          {/* Notes - Blue */}
          <NavCard
            href="/notes"
            title="Notas"
            description="Anote ideias"
            icon={FileText}
            iconSize={32}
            color="blue"
          />

          {/* Ideas - Yellow */}
          <NavCard
            href="/ideas"
            title="Ideias"
            description="Capture inspirações"
            icon={Lightbulb}
            className="col-span-2"
            iconSize={36}
            color="yellow"
          />

          {/* Favorites - Yellow */}
          <NavCard
            href="/favorites"
            title="Favoritos"
            description="Itens salvos"
            icon={Star}
            className="col-span-2"
            iconSize={36}
            color="yellow"
          />

          {/* Settings - Blue */}
          <NavCard
            href="/settings"
            title="Configurações"
            description="Personalize o Otto"
            icon={Settings}
            className="col-span-2"
            iconSize={36}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}

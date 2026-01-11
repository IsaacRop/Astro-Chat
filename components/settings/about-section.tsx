"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    MessageCircle,
    Network,
    FileText,
    CheckSquare,
    CalendarDays,
    Lightbulb,
    Sparkles,
} from "lucide-react";

const features = [
    {
        id: "chat",
        icon: MessageCircle,
        title: "Chat (Otto)",
        description:
            "Seu tutor de IA 24h. Use para tirar dúvidas, pedir explicações e debater tópicos. O Otto lembra das conversas passadas.",
    },
    {
        id: "cadernos",
        icon: Network,
        title: "Cadernos (Grafo)",
        description:
            "A visualização do seu cérebro. Diferente de pastas comuns, aqui suas conversas viram 'nós' em um grafo. Quanto mais você estuda um assunto, maior o nó fica. Conecte ideias visualmente.",
    },
    {
        id: "notas",
        icon: FileText,
        title: "Notas (Editor)",
        description:
            "Seu fichário digital. Um editor de texto focado para criar resumos, colar respostas do Otto e organizar seu conhecimento com formatação rica.",
    },
    {
        id: "tarefas",
        icon: CheckSquare,
        title: "Tarefas (Kanban)",
        description:
            "Gestão visual de pendências. Organize seus estudos em 'A Fazer', 'Em Andamento' e 'Concluído'.",
    },
    {
        id: "calendario",
        icon: CalendarDays,
        title: "Calendário",
        description:
            "Sua agenda de estudos. Marque provas, prazos de entrega e horários de revisão.",
    },
    {
        id: "ideias",
        icon: Lightbulb,
        title: "Ideias & Favoritos",
        description:
            "Captura rápida. Guarde links úteis e pensamentos relâmpago para não perder o foco durante o estudo.",
    },
];

export function AboutSection() {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-serif font-medium text-zinc-200 border-b border-white/[0.05] pb-3">
                Guia do Sistema
            </h2>

            {/* Manifesto Header */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/[0.05] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.05] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-indigo-400" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif font-medium text-zinc-200 mb-2 flex items-center gap-2">
                            Sobre o Otto
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-full">
                                Beta
                            </span>
                        </h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            O Otto não é apenas um chat. É um{" "}
                            <span className="text-zinc-200 font-medium">
                                ecossistema de aprendizado personalizado
                            </span>{" "}
                            que conecta suas dúvidas, anotações e planejamento em um único
                            lugar.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature Accordion */}
            <div className="bg-[#1A1A1C] border border-white/[0.05] rounded-2xl overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                    {features.map((feature) => (
                        <AccordionItem
                            key={feature.id}
                            value={feature.id}
                            className="border-white/[0.05] px-6"
                        >
                            <AccordionTrigger className="hover:no-underline group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/[0.05] transition-colors">
                                        <feature.icon
                                            className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <span className="font-serif text-zinc-200 group-hover:text-white transition-colors">
                                        {feature.title}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-zinc-400 leading-relaxed pl-11">
                                {feature.description}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}

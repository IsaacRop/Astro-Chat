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
            <h2 className="text-xl font-serif font-medium text-[#1E2E25] border-b border-[#E2EDE6] pb-3">
                Guia do Sistema
            </h2>

            {/* Manifesto Header */}
            <div className="bg-gradient-to-br from-[#DFF0E5] via-[#DFF0F0]/30 to-transparent border border-[#E2EDE6] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EDF4EF] border border-[#E2EDE6] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-[#4A9E6B]" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif font-medium text-[#1E2E25] mb-2 flex items-center gap-2">
                            Sobre o Otto
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#DFF0E5] text-[#4A9E6B] border border-[#4A9E6B]/20 rounded-full">
                                Beta
                            </span>
                        </h3>
                        <p className="text-[#5A7565] text-sm leading-relaxed">
                            O Otto não é apenas um chat. É um{" "}
                            <span className="text-[#1E2E25] font-medium">
                                ecossistema de aprendizado personalizado
                            </span>{" "}
                            que conecta suas dúvidas, anotações e planejamento em um único
                            lugar.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature Accordion */}
            <div className="bg-white border border-[#E2EDE6] rounded-2xl overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                    {features.map((feature) => (
                        <AccordionItem
                            key={feature.id}
                            value={feature.id}
                            className="border-[#E2EDE6] px-6"
                        >
                            <AccordionTrigger className="hover:no-underline group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#F5F9F6] border border-[#E2EDE6] flex items-center justify-center group-hover:bg-[#EDF4EF] transition-colors">
                                        <feature.icon
                                            className="w-4 h-4 text-[#8BA698] group-hover:text-[#1E2E25] transition-colors"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <span className="font-serif text-[#1E2E25] group-hover:text-[#4A9E6B] transition-colors">
                                        {feature.title}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-[#5A7565] leading-relaxed pl-11">
                                {feature.description}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}

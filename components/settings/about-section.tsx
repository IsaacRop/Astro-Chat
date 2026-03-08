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
            <h2 className="text-xl font-serif font-medium text-foreground border-b border-border pb-3">
                Guia do Sistema
            </h2>

            {/* Manifesto Header */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif font-medium text-foreground mb-2 flex items-center gap-2">
                            Sobre o Otto
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full">
                                Beta
                            </span>
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            O Otto não é apenas um chat. É um{" "}
                            <span className="text-foreground font-medium">
                                ecossistema de aprendizado personalizado
                            </span>{" "}
                            que conecta suas dúvidas, anotações e planejamento em um único
                            lugar.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature Accordion */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                    {features.map((feature) => (
                        <AccordionItem
                            key={feature.id}
                            value={feature.id}
                            className="border-border px-6"
                        >
                            <AccordionTrigger className="hover:no-underline group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center group-hover:bg-muted transition-colors">
                                        <feature.icon
                                            className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <span className="font-serif text-foreground group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed pl-11">
                                {feature.description}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}

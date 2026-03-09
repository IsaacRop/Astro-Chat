import { Book, CheckSquare, MessageSquare, PlusCircle } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">

            <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-serif font-bold text-foreground">Como usar o Otto</h1>
                    <p className="text-muted-foreground text-lg">
                        Descubra como aproveitar ao máximo os recursos do seu assistente de estudos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Guia: Chat */}
                    <section className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <MessageSquare size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif font-medium">Chat & Conhecimento</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Interaja com a inteligência artificial para resumir textos, tirar dúvidas complexas e gerar ideias para seus estudos.
                            O Otto cria mapas mentais automáticos baseado nas suas conversas.
                        </p>
                    </section>

                    {/* Guia: Tarefas */}
                    <section className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <CheckSquare size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif font-medium">Quadro de Tarefas</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Organize suas atividades usando a metodologia Kanban. 
                            Arraste tarefas entre "A Fazer", "Em Andamento" e "Concluído" para manter o controle total do seu fluxo de estudo.
                        </p>
                    </section>

                    {/* Guia: Cadernos */}
                    <section className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Book size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif font-medium">Cadernos Literários</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Crie pastas organizadas por disciplinas ou projetos. Dentro de cada caderno, mantenha suas anotações
                            e resumos bem estruturados, facilitando a revisão para provas.
                        </p>
                    </section>
                    
                    {/* Dica Extra */}
                    <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                                <PlusCircle size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif font-medium text-foreground">Dicas Rápidas</h2>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                            <li>Use o atalho <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-xs">⌘K</kbd> para buscar rapidamente.</li>
                            <li>Personalize a aparência do Otto no menu de Configurações.</li>
                            <li>Salve mensagens importantes no Chat enviando-as para os seus Favoritos.</li>
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
}

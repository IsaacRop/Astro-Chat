import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquarePlus, Settings, LogOut, LayoutGrid, Plus } from "lucide-react";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/");
    }

    const userName = user.user_metadata.full_name || user.email?.split("@")[0] || "Explorador";

    return (
        <div className="flex h-screen bg-[#0C0C0D] text-zinc-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/[0.05] p-6 flex flex-col hidden md:flex">
                <div className="flex items-center gap-2 px-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <span className="font-serif font-bold text-indigo-400">O</span>
                    </div>
                    <span className="font-serif text-lg tracking-tight text-white/90">Otto</span>
                </div>

                <nav className="space-y-1 flex-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-white/90 bg-white/[0.03] rounded-lg border border-white/[0.05] transition-colors">
                        <LayoutGrid size={18} />
                        Visão Geral
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01] rounded-lg transition-colors">
                        <MessageSquarePlus size={18} />
                        Chats
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01] rounded-lg transition-colors">
                        <Settings size={18} />
                        Configurações
                    </button>
                </nav>

                <div className="pt-6 border-t border-white/[0.05]">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center text-xs font-medium text-white">
                            {userName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-white/90">{userName}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 bg-[#0C0C0D]">
                <header className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8">
                    <h1 className="text-xl font-serif text-white/90">Visão Geral</h1>
                    {/* Mobile menu trigger could go here */}
                </header>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div>
                            <h2 className="text-2xl font-serif text-white mb-2">Bem-vindo de volta, {userName}.</h2>
                            <p className="text-zinc-400">Aqui está o resumo das suas atividades recentes.</p>
                        </div>

                        {/* Empty State Card */}
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                                <MessageSquarePlus className="w-8 h-8 text-zinc-500" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-200 mb-2">Sua jornada começa aqui</h3>
                            <p className="text-zinc-500 max-w-sm mb-6">
                                Você ainda não iniciou nenhum estudo hoje. Crie um novo chat para começar a explorar.
                            </p>
                            <button className="group relative inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-zinc-50 px-6 py-2 text-sm font-medium text-zinc-900 ring-offset-background transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                                <Plus className="w-4 h-4 mr-2" />
                                Começar Novo Chat
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

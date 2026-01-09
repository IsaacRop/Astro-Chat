import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckSquare } from "lucide-react";
import Link from "next/link";

export default async function TasksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-[#0C0C0D] p-4 md:p-8 flex flex-col">
            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <CheckSquare size={24} />
                        </div>
                        <h1 className="text-2xl font-serif text-zinc-100">Tarefas</h1>
                    </div>
                </div>

                {/* Content placeholder */}
                <div className="flex-1 bg-[#1A1A1C] border border-white/[0.05] rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6">
                        <CheckSquare size={32} className="text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-medium text-zinc-200 mb-2">Kanban Board em breve</h2>
                    <p className="text-zinc-500 max-w-sm">
                        Gerencie suas tarefas e projetos com um quadro visual intuitivo. Funcionalidade em desenvolvimento.
                    </p>
                </div>
            </div>
        </main>
    );
}


import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-[#0C0C0D] flex flex-col p-4 md:p-8">
            {/* Header */}
            <div className="max-w-md mx-auto w-full mb-8 flex items-center gap-4">
                <Link href="/" className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Painel</span>
            </div>

            {/* Card */}
            <div className="flex-1 flex flex-col items-center justify-start pt-4 sm:pt-12">
                <div className="w-full max-w-md relative">
                    {/* Glassmorphic Card */}
                    <div className="bg-[#1A1A1C]/80 backdrop-blur-md border border-white/[0.05] rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                        {/* Title */}
                        <div className="text-center mb-10">
                            <h1 className="font-serif text-2xl text-zinc-100 mb-2">Sua Identidade</h1>
                            <p className="text-sm text-zinc-500">Gerencie como você aparece para o Otto.</p>
                        </div>

                        <ProfileForm user={user} />

                    </div>

                    {/* Decorative element */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                <p className="text-xs text-zinc-700 mt-12 text-center max-w-xs">
                    Otto ID: {user.id.slice(0, 8)}...
                </p>
            </div>
        </main>
    );
}

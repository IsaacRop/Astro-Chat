"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, User, Mail, LogOut, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions/profile";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleDeleteAccount = async () => {
        if (!confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível.")) {
            return;
        }
        
        // Em um app real, chamaria a server action para excluir a conta de fato. 
        // Aqui apenas fazemos sign out como fallback
        alert("Sua conta seria excluída aqui.");
        await signOut();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
                <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
                <p className="mt-4 text-muted-foreground text-sm">Carregando perfil...</p>
            </div>
        );
    }

    if (!user) {
        router.push("/");
        return null;
    }

    const name = user.user_metadata?.full_name || user.user_metadata?.name || "Usuário não identificado";
    const initials = name.slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">

            <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8">
                {/* Cabeçalho do Perfil */}
                <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left shadow-sm">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#4A9E6B] to-[#3B8558] text-white flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase shadow-inner flex-shrink-0">
                        {initials}
                    </div>
                    <div className="space-y-2 flex-1">
                        <h1 className="text-2xl font-serif font-bold text-foreground">{name}</h1>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground bg-muted w-max px-3 py-1.5 rounded-lg text-sm mx-auto sm:mx-0">
                            <Mail size={14} />
                            <span>{user.email}</span>
                        </div>
                        <div className="pt-2">
                           <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                               Plano Gratuito
                           </span>
                        </div>
                    </div>
                </section>

                {/* Opções de Conta */}
                <section className="space-y-4">
                    <h2 className="text-lg font-serif font-medium text-foreground border-b border-border pb-2 px-1">Configurações da Conta</h2>
                    
                    <div className="flex flex-col gap-3">
                        <button className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors text-left group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg text-foreground group-hover:text-primary transition-colors">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground text-sm">Mudar nome de usuário</p>
                                    <p className="text-xs text-muted-foreground">Atualize como você aparece no Otto</p>
                                </div>
                            </div>
                            <ArrowLeft size={16} className="text-muted-foreground rotate-180" />
                        </button>

                        <form action={signOut} className="w-full">
                            <button type="submit" className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-destructive/30 hover:bg-destructive/5 transition-colors text-left group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg text-foreground group-hover:text-destructive group-hover:bg-destructive/10 transition-colors">
                                        <LogOut size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground text-sm group-hover:text-destructive transition-colors">Sair da conta</p>
                                        <p className="text-xs text-muted-foreground group-hover:text-destructive/70 transition-colors">Encerrar a sessão atual</p>
                                    </div>
                                </div>
                            </button>
                        </form>
                    </div>
                </section>

                {/* Zona de Perigo */}
                <section className="pt-8">
                    <div className="p-5 border border-destructive/20 bg-destructive/5 rounded-2xl space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50" />
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-destructive">Zona de Perigo</h3>
                                <p className="text-xs text-destructive/80 mt-1 leading-relaxed max-w-md">
                                    A exclusão da conta é permanente. Todos os seus cadernos, notas e tarefas serão apagados e não poderão ser recuperados.
                                </p>
                            </div>
                        </div>
                        <div className="pt-2">
                             <button 
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium rounded-lg border border-destructive/20 hover:bg-destructive hover:text-white transition-colors"
                            >
                                Excluir minha conta
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

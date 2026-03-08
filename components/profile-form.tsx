"use client";

import { useState, useTransition } from "react";
import { User } from "@supabase/supabase-js";
import { Loader2, Camera, LogOut, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, deleteAccount, signOut } from "@/app/actions/profile";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileFormProps {
    user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const router = useRouter();

    // Initial values
    const initialName = user.user_metadata.full_name || "";
    const initialNickname = user.user_metadata.nickname || initialName.split(" ")[0] || "";

    const [hasChanges, setHasChanges] = useState(false);

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateProfile(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.success);
                setHasChanges(false);
            }
        });
    };

    const handleDeleteAccount = () => {
        startDeleteTransition(async () => {
            const result = await deleteAccount();
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Conta excluída. Até logo!");
                window.location.href = "/";
            }
        });
    };

    const handleSignOut = async () => {
        await signOut();
    }

    return (
        <div className="space-y-12">
            <form action={handleSubmit} onChange={() => setHasChanges(true)} className="space-y-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-2 border-[#E2EDE6] overflow-hidden shadow-2xl">
                            {user.user_metadata.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={initialName}
                                    className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#DFF0E5] flex items-center justify-center text-2xl font-serif text-[#4A9E6B]">
                                    {initialName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="absolute bottom-0 right-0 p-2 rounded-full bg-[#EDF4EF] border border-[#D0E0D6] text-[#8BA698] hover:text-[#1E2E25] hover:border-[#4A9E6B]/30 transition-all shadow-lg"
                            title="Alterar foto (Em breve)"
                        >
                            <Camera size={14} />
                        </button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-[#8BA698] font-medium">{user.email}</p>
                    </div>
                </div>

                {/* Inputs */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-[#8BA698] font-medium ml-1">
                            Nome Completo
                        </label>
                        <input
                            name="fullName"
                            defaultValue={initialName}
                            className="w-full bg-[#F5F9F6] border border-[#E2EDE6] rounded-xl px-4 py-3 text-[#1E2E25] focus:outline-none focus:border-[#4A9E6B]/50 focus:ring-1 focus:ring-[#4A9E6B]/30 transition-all placeholder:text-[#8BA698]"
                            placeholder="Seu nome"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium ml-1">
                            Como quer ser chamado?
                        </label>
                        <input
                            name="nickname"
                            defaultValue={initialNickname}
                            className="w-full bg-[#F5F9F6] border border-[#E2EDE6] rounded-xl px-4 py-3 text-[#1E2E25] focus:outline-none focus:border-[#4A9E6B]/50 focus:ring-1 focus:ring-[#4A9E6B]/30 transition-all placeholder:text-[#8BA698]"
                            placeholder="Apelido ou primeiro nome"
                        />
                        <p className="text-[11px] text-[#8BA698] pl-1">
                            Isso é como o Otto vai chamar você nas conversas.
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <div className="h-12 flex items-center justify-center">
                    {(hasChanges || isPending) && (
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-8 py-2.5 bg-[#4A9E6B] hover:bg-[#3B8558] text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(74,158,107,0.3)] animate-in fade-in slide-in-from-bottom-2"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
                        </button>
                    )}
                </div>
            </form>

            <div className="border-t border-[#E2EDE6] my-8" />

            {/* Account Actions */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleSignOut}
                    className="flex items-center justify-between w-full p-4 rounded-xl border border-[#E2EDE6] bg-transparent hover:bg-[#F5F9F6] transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#EDF4EF] border border-[#D0E0D6] group-hover:border-[#4A9E6B]/30 transition-colors">
                            <LogOut size={16} className="text-[#8BA698] group-hover:text-[#5A7565]" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-[#1E2E25] group-hover:text-[#4A9E6B]">Sair da conta</p>
                            <p className="text-xs text-[#8BA698]">Encerrar sessão neste dispositivo</p>
                        </div>
                    </div>
                </button>

                {/* Delete Account Dialog */}
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            className="flex items-center justify-between w-full p-4 rounded-xl border border-transparent hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-transparent border border-transparent group-hover:border-red-500/30 transition-colors">
                                    <Trash2 size={16} className="text-[#8BA698] group-hover:text-red-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-[#8BA698] group-hover:text-red-400">Excluir minha conta</p>
                                    <p className="text-xs text-[#8BA698] group-hover:text-red-500/70">Ação irreversível</p>
                                </div>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-red-200">
                        <DialogHeader>
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                                <ShieldAlert size={24} />
                            </div>
                            <DialogTitle className="text-red-500 font-serif text-xl">Tem certeza absoluta?</DialogTitle>
                            <DialogDescription className="text-[#5A7565] pt-2 pb-4">
                                Essa ação é <strong>irreversível</strong>. Todo seu histórico de conversas, memórias e anotações com o Otto será apagado permanentemente.
                                <br /><br />
                                Não há como recuperar esses dados.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                                Sim, excluir tudo
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

"use client";

import { useState, useTransition, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { Loader2, Camera, LogOut, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, deleteAccount, signOut } from "@/app/actions/profile";
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initialName = user.user_metadata.full_name || "";

    const [hasChanges, setHasChanges] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.user_metadata.avatar_url || null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast.error("Formato inválido. Use JPG, PNG ou WebP.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo 2 MB.");
            return;
        }

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await fetch("/api/profile/avatar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Erro ao enviar foto.");
                return;
            }

            setAvatarUrl(data.avatarUrl);
            toast.success("Foto atualizada!");
        } catch {
            toast.error("Erro de conexão ao enviar foto.");
        } finally {
            setUploadingAvatar(false);
            // Reset file input so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
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
    };

    return (
        <div className="space-y-8 md:space-y-12">
            <form action={handleSubmit} onChange={() => setHasChanges(true)} className="space-y-6 md:space-y-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3 md:gap-4">
                    <div className="relative group">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-border overflow-hidden shadow-2xl">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={initialName}
                                    className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-serif text-primary">
                                    {initialName.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            className="absolute bottom-0 right-0 p-2 min-w-[36px] min-h-[36px] rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
                            title="Alterar foto"
                        >
                            <Camera size={14} />
                        </button>
                    </div>
                    <div className="text-center min-w-0 w-full px-4">
                        <p className="text-sm text-muted-foreground font-medium truncate">{user.email}</p>
                    </div>
                </div>

                {/* Inputs */}
                <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium ml-1">
                            Nome Completo
                        </label>
                        <input
                            name="fullName"
                            defaultValue={initialName}
                            className="w-full bg-muted border border-border rounded-xl px-4 py-3 min-h-[44px] text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                            placeholder="Seu nome"
                        />
                    </div>

                </div>

                {/* Save Button */}
                <div className="min-h-[44px] flex items-center justify-center">
                    {(hasChanges || isPending) && (
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-8 py-3 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium transition-all shadow-lg shadow-primary/30 animate-in fade-in slide-in-from-bottom-2"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
                        </button>
                    )}
                </div>
            </form>

            <div className="border-t border-border my-6 md:my-8" />

            {/* Account Actions */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleSignOut}
                    className="flex items-center justify-between w-full p-4 min-h-[44px] rounded-xl border border-border bg-transparent hover:bg-muted transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50 border border-border group-hover:border-primary/30 transition-colors flex-shrink-0">
                            <LogOut size={16} className="text-muted-foreground group-hover:text-foreground" />
                        </div>
                        <div className="text-left min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary">Sair da conta</p>
                            <p className="text-xs text-muted-foreground">Encerrar sessão neste dispositivo</p>
                        </div>
                    </div>
                </button>

                {/* Delete Account Dialog */}
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            className="flex items-center justify-between w-full p-4 min-h-[44px] rounded-xl border border-transparent hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-transparent border border-transparent group-hover:border-red-500/30 transition-colors flex-shrink-0">
                                    <Trash2 size={16} className="text-muted-foreground group-hover:text-red-400" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-sm font-medium text-muted-foreground group-hover:text-red-400">Excluir minha conta</p>
                                    <p className="text-xs text-muted-foreground group-hover:text-red-500/70">Ação irreversível</p>
                                </div>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-red-500/20">
                        <DialogHeader>
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 flex-shrink-0">
                                <ShieldAlert size={24} />
                            </div>
                            <DialogTitle className="text-red-500 font-serif text-lg md:text-xl">Tem certeza absoluta?</DialogTitle>
                            <DialogDescription className="text-muted-foreground pt-2 pb-4">
                                Essa ação é <strong>irreversível</strong>. Todo seu histórico de conversas, memórias e anotações com o Otto será apagado permanentemente.
                                <br /><br />
                                Não há como recuperar esses dados.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 justify-end flex-wrap">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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

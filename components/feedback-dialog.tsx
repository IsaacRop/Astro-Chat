"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquarePlus, Bug, Lightbulb, HelpCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { submitFeedback } from "@/app/actions/submit-feedback";
import { cn } from "@/lib/utils";

interface FeedbackDialogProps {
    children?: React.ReactNode;
}

export function FeedbackDialog({ children }: FeedbackDialogProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState("feature");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        formData.set("type", type);
        startTransition(async () => {
            const result = await submitFeedback(formData);
            if (result.success) {
                toast.success(result.message || "Obrigado! Sua contribuição foi registrada.");
                setOpen(false);
            } else {
                toast.error(result.message || "Erro ao enviar feedback.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        <MessageSquarePlus className="w-4 h-4" />
                        Feedback
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-[#1A1A1C] border-white/10 sm:max-w-[500px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4 bg-[#1A1A1C]">
                    <DialogTitle className="font-serif text-2xl text-zinc-100 font-normal">
                        Sua voz molda o Otto
                    </DialogTitle>
                    <DialogDescription className="font-sans text-zinc-400 text-base mt-2">
                        Encontrou um erro ou tem uma ideia brilhante? Conte para a gente.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="flex flex-col">
                    <div className="px-6 space-y-4">
                        {/* Type Selection */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: "feature", label: "Ideia", icon: Lightbulb },
                                { id: "bug", label: "Bug", icon: Bug },
                                { id: "other", label: "Outro", icon: HelpCircle },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setType(item.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
                                        type === item.id
                                            ? "bg-white/10 border-white/20 text-white shadow-inner"
                                            : "bg-black/20 border-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", type === item.id ? "text-white" : "text-current")} strokeWidth={1.5} />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Textarea */}
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-xs font-medium text-zinc-500 uppercase tracking-wider pl-1">
                                Mensagem
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                required
                                placeholder={
                                    type === "feature" ? "Eu adoraria se..." :
                                        type === "bug" ? "Quando eu clico em..." :
                                            "Sobre..."
                                }
                                className="w-full min-h-[140px] p-4 rounded-xl bg-black/20 border border-white/5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 resize-none font-sans text-sm leading-relaxed transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-6 pt-4 mt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Feedback"
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

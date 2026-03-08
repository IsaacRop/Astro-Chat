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
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#5A7565] hover:text-[#1E2E25] transition-colors">
                        <MessageSquarePlus className="w-4 h-4" />
                        Feedback
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-white border-[#E2EDE6] sm:max-w-[500px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4 bg-white">
                    <DialogTitle className="font-serif text-2xl text-[#1E2E25] font-normal">
                        Sua voz molda o Otto
                    </DialogTitle>
                    <DialogDescription className="font-sans text-[#5A7565] text-base mt-2">
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
                                            ? "bg-[#DFF0E5] border-[#4A9E6B]/30 text-[#4A9E6B] shadow-inner"
                                            : "bg-[#F5F9F6] border-transparent text-[#8BA698] hover:bg-[#EDF4EF] hover:text-[#5A7565]"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", type === item.id ? "text-[#4A9E6B]" : "text-current")} strokeWidth={1.5} />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Textarea */}
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-xs font-medium text-[#8BA698] uppercase tracking-wider pl-1">
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
                                className="w-full min-h-[140px] p-4 rounded-xl bg-[#F5F9F6] border border-[#E2EDE6] text-[#1E2E25] placeholder:text-[#8BA698] focus:outline-none focus:ring-1 focus:ring-[#4A9E6B]/30 focus:border-[#4A9E6B]/50 resize-none font-sans text-sm leading-relaxed transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-6 pt-4 mt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-xl bg-[#4A9E6B] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#3B8558] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
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

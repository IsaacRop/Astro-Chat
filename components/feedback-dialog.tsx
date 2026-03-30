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
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquarePlus className="w-4 h-4" />
                        Feedback
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[500px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-4 md:p-6 pb-3 md:pb-4 bg-card">
                    <DialogTitle className="font-serif text-xl md:text-2xl text-foreground font-normal">
                        Sua voz molda o Otto
                    </DialogTitle>
                    <DialogDescription className="font-sans text-muted-foreground text-sm md:text-base mt-2">
                        Encontrou um erro ou tem uma ideia brilhante? Conte para a gente.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="flex flex-col">
                    <div className="px-4 md:px-6 space-y-3 md:space-y-4">
                        {/* Type Selection */}
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
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
                                        "flex flex-col items-center justify-center gap-1.5 md:gap-2 p-3 min-h-[64px] rounded-xl border transition-all duration-200",
                                        type === item.id
                                            ? "bg-primary/10 border-primary/30 text-primary shadow-inner"
                                            : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", type === item.id ? "text-primary" : "text-current")} strokeWidth={1.5} />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Textarea */}
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
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
                                className="w-full min-h-[120px] md:min-h-[140px] p-3 md:p-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 resize-none font-sans text-sm leading-relaxed transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-4 md:p-6 pt-3 md:pt-4 mt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 min-h-[44px] rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
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

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionManagementProps {
    planTier: string;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
}

function statusColor(status: string | null) {
    switch (status) {
        case "active":
            return "bg-green-500";
        case "canceled":
            return "bg-amber-500";
        case "past_due":
            return "bg-red-500";
        default:
            return "bg-gray-400";
    }
}

function statusLabel(status: string | null) {
    switch (status) {
        case "active":
            return "Ativa";
        case "canceled":
            return "Cancelada";
        case "past_due":
            return "Pagamento pendente";
        default:
            return "Desconhecido";
    }
}

export function SubscriptionManagement({
    planTier,
    subscriptionStatus,
    currentPeriodEnd,
}: SubscriptionManagementProps) {
    const [loading, setLoading] = useState<"manage" | "cancel" | null>(null);

    const openPortal = async (action: "manage" | "cancel") => {
        setLoading(action);
        try {
            const res = await fetch("/api/stripe/portal", { method: "POST" });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("Portal full error:", JSON.stringify(err, null, 2));
                toast.error(`Erro: ${err.detail || err.error}`);
                return;
            }

            const { url } = await res.json();

            if (!url) {
                toast.error("URL do portal não encontrada.");
                return;
            }

            window.location.href = url;
        } catch (err) {
            console.error("[portal] Unexpected error:", err);
            toast.error("Erro inesperado. Tente novamente.");
        } finally {
            setLoading(null);
        }
    };

    const formattedDate = currentPeriodEnd
        ? new Date(currentPeriodEnd).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          })
        : "—";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-card border border-[#E2EDE6] dark:border-border rounded-2xl p-6 md:p-8 max-w-lg mx-auto"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#4A9E6B]/10">
                    <Crown size={20} className="text-[#4A9E6B]" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[#1E2E25] dark:text-foreground">
                        Sua assinatura
                    </h2>
                    <p className="text-sm text-[#8BA698]">Gerencie seu plano Otto Pro</p>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-[#E2EDE6] dark:border-border">
                    <span className="text-sm text-[#5A7565]">Plano</span>
                    <span className="text-sm font-semibold text-[#1E2E25] dark:text-foreground">
                        {planTier === "pro" ? "Otto Pro" : "Gratuito"}
                    </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#E2EDE6] dark:border-border">
                    <span className="text-sm text-[#5A7565]">Status</span>
                    <span className="flex items-center gap-2 text-sm font-medium text-[#1E2E25] dark:text-foreground">
                        <span className={`w-2 h-2 rounded-full ${statusColor(subscriptionStatus)}`} />
                        {statusLabel(subscriptionStatus)}
                    </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#E2EDE6] dark:border-border">
                    <span className="text-sm text-[#5A7565]">Próxima cobrança</span>
                    <span className="text-sm font-medium text-[#1E2E25] dark:text-foreground">
                        {formattedDate}
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => openPortal("manage")}
                    disabled={loading !== null}
                    className="flex-1 flex items-center justify-center gap-2 py-3 min-h-[44px] bg-[#4A9E6B] hover:bg-[#3B8558] text-white font-semibold rounded-lg text-sm transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading === "manage" ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <ExternalLink size={16} />
                    )}
                    Gerenciar assinatura
                </button>
                <button
                    onClick={() => openPortal("cancel")}
                    disabled={loading !== null}
                    className="flex-1 flex items-center justify-center gap-2 py-3 min-h-[44px] border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-semibold rounded-lg text-sm transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading === "cancel" ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    Cancelar assinatura
                </button>
            </div>
        </motion.div>
    );
}

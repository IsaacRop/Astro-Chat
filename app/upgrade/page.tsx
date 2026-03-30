"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Loader2, Lock, RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { SubscriptionManagement } from "@/components/subscription/SubscriptionManagement";

const freeFeatures = [
    "10 mensagens com Otto",
    "Até 3 provas e 3 flashcards",
    "Ferramentas básicas de organização",
];

const proFeatures = [
    "Todas as funções ilimitadas",
    "Mapa de desenvolvimento",
    "Estatísticas detalhadas",
    "Suporte prioritário",
];

const faqItems = [
    {
        question: "Posso cancelar a qualquer momento?",
        answer: "Sim, você pode cancelar sua assinatura a qualquer momento. Você mantém o acesso até o final do período pago.",
    },
    {
        question: "Como funciona o plano anual?",
        answer: "Você paga R$ 180,00 uma vez por ano, o que equivale a R$ 15,00 por mês — uma economia de 25% em relação ao plano mensal.",
    },
    {
        question: "Quais formas de pagamento são aceitas?",
        answer: "Aceitamos cartão de crédito e débito via Stripe. O pagamento é processado de forma segura.",
    },
    {
        question: "O que acontece se eu fizer downgrade?",
        answer: "Seus dados são preservados, mas o acesso fica limitado às funcionalidades do plano gratuito.",
    },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-[#E2EDE6] dark:border-border py-4">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-4 text-left cursor-pointer min-h-[44px]"
            >
                <span className="font-medium text-[#1E2E25] dark:text-foreground text-sm md:text-base">{question}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 text-[#8BA698]"
                >
                    <ChevronDown size={18} />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="pt-2 pb-1 text-sm text-[#8BA698] leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const PRICE_IDS = {
    monthly: "price_1T9Uk7CKO59buulnEpHz9iHj",
    yearly: "price_1TCHSVCKO59buulnTnbPy8DX",
} as const;

export default function UpgradePage() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [profile, setProfile] = useState<{
        plan_tier: string | null;
        subscription_status: string | null;
        current_period_end: string | null;
    } | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("plan_tier, subscription_status, current_period_end")
                    .eq("id", user.id)
                    .single();
                setProfile(data);
            }
            setProfileLoading(false);
        });
    }, []);

    const handleCheckout = async () => {
        setCheckoutLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId: PRICE_IDS[billing] }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao processar pagamento");
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.info(data.message || "Checkout em breve!");
            }
        } catch (err: any) {
            toast.error(err.message || "Erro ao processar pagamento. Tente novamente.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#4A9E6B]" />
            </div>
        );
    }

    if (profile?.plan_tier === "pro") {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
                <main className="flex-1 px-4 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
                    <div className="text-center mb-8 md:mb-10">
                        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#1E2E25] dark:text-foreground">
                            Sua assinatura
                        </h1>
                        <p className="mt-2 text-[#8BA698] text-sm md:text-base">
                            Gerencie seu plano Otto Pro
                        </p>
                    </div>
                    <SubscriptionManagement
                        planTier={profile.plan_tier}
                        subscriptionStatus={profile.subscription_status}
                        currentPeriodEnd={profile.current_period_end}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">
            <main className="flex-1 px-4 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">

                {/* Header */}
                <div className="text-center mb-8 md:mb-10">
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#1E2E25] dark:text-foreground">
                        Escolha seu plano
                    </h1>
                    <p className="mt-2 text-[#8BA698] text-sm md:text-base">
                        Desbloqueie todo o potencial do Otto para seus estudos
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-2 mb-8 md:mb-10">
                    <div className="flex items-center bg-[#EDF4EF] dark:bg-muted rounded-full p-1">
                        <button
                            onClick={() => setBilling("monthly")}
                            className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 min-h-[44px] ${
                                billing === "monthly"
                                    ? "bg-white dark:bg-card text-[#1E2E25] dark:text-foreground shadow-sm"
                                    : "text-[#8BA698] hover:text-[#5A7565]"
                            }`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBilling("yearly")}
                            className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 min-h-[44px] ${
                                billing === "yearly"
                                    ? "bg-white dark:bg-card text-[#1E2E25] dark:text-foreground shadow-sm"
                                    : "text-[#8BA698] hover:text-[#5A7565]"
                            }`}
                        >
                            Anual
                        </button>
                    </div>
                    <AnimatePresence>
                        {billing === "yearly" && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="bg-[#DFF0E5] text-[#4A9E6B] text-xs font-bold rounded-full px-2 py-0.5"
                            >
                                Economize 25%
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Plan Cards */}
                <div className="flex flex-col md:flex-row gap-6 justify-center">

                    {/* Free Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-white dark:bg-card border border-[#E2EDE6] dark:border-border rounded-2xl p-6 md:p-8 flex-1 flex flex-col"
                    >
                        <h3 className="text-lg font-bold text-[#1E2E25] dark:text-foreground">Gratuito</h3>
                        <div className="mt-3 mb-1">
                            <span className="text-4xl font-bold text-[#1E2E25] dark:text-foreground">R$ 0</span>
                        </div>
                        <p className="text-[#8BA698] text-sm mb-5">Para experimentar o Otto</p>

                        <div className="border-t border-[#E2EDE6] dark:border-border my-4" />

                        <ul className="space-y-3 flex-1">
                            {freeFeatures.map((feat) => (
                                <li key={feat} className="flex items-start gap-2.5 text-sm text-[#1E2E25] dark:text-foreground">
                                    <Check size={16} className="text-[#8BA698] flex-shrink-0 mt-0.5" />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <button
                            disabled
                            className="mt-6 w-full py-3 min-h-[44px] bg-[#EDF4EF] dark:bg-muted text-[#8BA698] font-semibold rounded-lg cursor-not-allowed text-sm"
                        >
                            Plano atual
                        </button>
                    </motion.div>

                    {/* Pro Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="bg-white dark:bg-card border-2 border-[#4A9E6B] rounded-2xl p-6 md:p-8 flex-1 flex flex-col relative shadow-lg shadow-[#4A9E6B]/5"
                    >
                        {/* Badge */}
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4A9E6B] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                            Mais popular
                        </span>

                        <h3 className="text-lg font-bold text-[#4A9E6B]">Pro</h3>

                        <div className="mt-3 mb-1">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={billing}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <span className="text-4xl font-bold text-[#1E2E25] dark:text-foreground">
                                        {billing === "monthly" ? "R$ 19,90" : "R$ 15,00"}
                                    </span>
                                    <span className="text-[#8BA698] text-base ml-1">/mês</span>
                                    {billing === "yearly" && (
                                        <p className="text-[#8BA698] text-xs mt-1">R$ 180,00 cobrado anualmente</p>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <p className="text-[#8BA698] text-sm mb-5">Para estudantes que levam a sério</p>

                        <div className="border-t border-[#E2EDE6] dark:border-border my-4" />

                        <ul className="space-y-3 flex-1">
                            {proFeatures.map((feat) => (
                                <li key={feat} className="flex items-start gap-2.5 text-sm text-[#1E2E25] dark:text-foreground">
                                    <Check size={16} className="text-[#4A9E6B] flex-shrink-0 mt-0.5" />
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleCheckout}
                            disabled={checkoutLoading}
                            className="mt-6 w-full py-3 min-h-[44px] bg-[#4A9E6B] hover:bg-[#3B8558] text-white font-semibold rounded-lg text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#4A9E6B]/20 disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {checkoutLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                "Assinar Pro"
                            )}
                        </button>
                    </motion.div>
                </div>

                {/* Trust Section */}
                <div className="flex flex-wrap justify-center gap-6 mt-8 md:mt-10">
                    <div className="flex items-center gap-2 text-sm text-[#8BA698]">
                        <Lock size={16} />
                        Pagamento seguro via Stripe
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#8BA698]">
                        <RotateCcw size={16} />
                        Cancele quando quiser
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#8BA698]">
                        <Zap size={16} />
                        Acesso imediato
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 md:mt-16 max-w-2xl mx-auto">
                    <h2 className="font-serif text-xl font-bold text-[#1E2E25] dark:text-foreground text-center mb-6">
                        Perguntas frequentes
                    </h2>
                    <div>
                        {faqItems.map((item) => (
                            <FAQItem key={item.question} question={item.question} answer={item.answer} />
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}

import { redirect } from "next/navigation";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { ConfettiBurst } from "@/components/confetti-burst";

export default async function SuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string }>;
}) {
    const { session_id } = await searchParams;

    if (!session_id) {
        redirect("/chat");
    }

    // Verify payment with Stripe
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        redirect("/chat");
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);

    let paid = false;
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        paid = session.payment_status === "paid";
    } catch {
        redirect("/chat");
    }

    if (!paid) {
        redirect("/chat");
    }

    return (
        <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center px-4">
            <ConfettiBurst />

            <div className="max-w-md w-full text-center space-y-6">
                {/* Success icon */}
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#DFF0E5] mx-auto">
                    <CheckCircle className="w-10 h-10 text-[#4A9E6B]" strokeWidth={1.5} />
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#4A9E6B]" />
                        <span className="text-sm font-semibold text-[#4A9E6B] uppercase tracking-wide">
                            Upgrade concluído
                        </span>
                        <Sparkles className="w-5 h-5 text-[#4A9E6B]" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1E2E25] dark:text-foreground">
                        Bem-vindo ao Otto Pro!
                    </h1>
                    <p className="text-[#8BA698] text-sm md:text-base leading-relaxed">
                        Seu pagamento foi confirmado com sucesso. Agora você tem acesso
                        ilimitado a todas as funcionalidades do Otto.
                    </p>
                </div>

                {/* Features unlocked */}
                <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-3">
                    <p className="text-xs font-semibold text-[#8BA698] uppercase tracking-wide">
                        Desbloqueado para você
                    </p>
                    {[
                        "Chat ilimitado com Otto",
                        "Cadernos e notas ilimitados",
                        "Tarefas, calendário e ideias",
                        "Suporte prioritário",
                    ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2.5">
                            <CheckCircle className="w-4 h-4 text-[#4A9E6B] flex-shrink-0" />
                            <span className="text-sm text-foreground">{feature}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 min-h-[44px] bg-[#4A9E6B] hover:bg-[#3B8558] text-white font-semibold rounded-lg text-base transition-all duration-200 hover:shadow-lg hover:shadow-[#4A9E6B]/20"
                >
                    Ir para o Chat
                    <ArrowRight size={18} />
                </Link>

                <p className="text-xs text-[#8BA698]">
                    Um recibo foi enviado para o seu e-mail.
                </p>
            </div>
        </div>
    );
}

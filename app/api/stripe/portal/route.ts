import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();

        if (profileError || !profile?.stripe_customer_id) {
            console.error("[stripe/portal] Profile error:", profileError);
            return NextResponse.json(
                { error: "Nenhuma assinatura encontrada" },
                { status: 404 }
            );
        }

        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 });
        }

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(key);

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            configuration: "bpc_1TDuJXCKO59buulnwvfRpfVD",
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error("[stripe/portal] Unexpected error:", err);
        return NextResponse.json(
            { error: "Erro interno ao abrir portal" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { plan } = await req.json();

    if (plan !== "monthly" && plan !== "yearly") {
        return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    // TODO: Initialize Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });

    // TODO: Map plan to Stripe price IDs
    // const priceId = plan === "monthly"
    //     ? "price_MONTHLY_ID_HERE"   // R$ 19,90/mês
    //     : "price_YEARLY_ID_HERE";   // R$ 180,00/ano (R$ 15,00/mês)

    // TODO: Create Stripe checkout session
    // const session = await stripe.checkout.sessions.create({
    //     mode: "subscription",
    //     customer_email: user.email,
    //     line_items: [{ price: priceId, quantity: 1 }],
    //     success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?success=true`,
    //     cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?canceled=true`,
    //     metadata: { userId: user.id, plan },
    // });

    // TODO: Return the Stripe checkout URL
    // return NextResponse.json({ url: session.url });

    // Placeholder response until Stripe is configured
    return NextResponse.json({
        message: "Stripe ainda não configurado. Configure as variáveis de ambiente e price IDs.",
    });
}

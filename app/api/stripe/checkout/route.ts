import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const VALID_PRICE_IDS = new Set([
    "price_1T9Uk7CKO59buulnEpHz9iHj", // Monthly
    "price_1TCHSVCKO59buulnTnbPy8DX", // Annual
]);

export async function POST(req: Request) {
    try {
        // 1. Parse body
        const { priceId } = await req.json().catch(() => ({ priceId: undefined }));

        if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
            return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
        }

        // 2. Authenticate
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        // 3. Init Stripe
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 });
        }

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(key);

        // 4. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer_email: user.email,
            client_reference_id: user.id,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/upgrade`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[stripe/checkout] Error:", message, err);
        return NextResponse.json(
            { error: "Falha ao criar sessão de pagamento" },
            { status: 500 }
        );
    }
}

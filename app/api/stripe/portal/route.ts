import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
    try {
        console.log("[portal] Starting portal session creation");
        console.log("[portal] STRIPE_SECRET_KEY defined:", !!process.env.STRIPE_SECRET_KEY);
        console.log("[portal] STRIPE_SECRET_KEY prefix:", process.env.STRIPE_SECRET_KEY?.slice(0, 12));
        console.log("[portal] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
        console.log("[portal] NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);

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
            console.error("[portal] Profile error:", profileError);
            return NextResponse.json(
                { error: "Nenhuma assinatura encontrada" },
                { status: 404 }
            );
        }

        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 });
        }

        console.log("[portal] stripe_customer_id:", profile.stripe_customer_id);

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(key);

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            configuration: "bpc_1TDuJXCKO59buulnwvfRpfVD",
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
        });

        console.log("[portal] Session created:", session.url);
        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("[portal] Error type:", err?.type);
        console.error("[portal] Error message:", err?.message);
        console.error("[portal] Error code:", err?.code);
        console.error("[portal] Error status:", err?.statusCode);

        return NextResponse.json(
            { error: "Internal server error", detail: err?.message || String(err) },
            { status: 500 }
        );
    }
}

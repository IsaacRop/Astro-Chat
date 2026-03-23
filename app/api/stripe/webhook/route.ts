import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase service role env vars");
    return createClient(url, key);
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!key || !webhookSecret) {
        return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const StripeSDK = (await import("stripe")).default;
    const stripe = new StripeSDK(key);

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            webhookSecret
        );
    } catch (err: any) {
        console.error("[stripe/webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getServiceClient();

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (!userId) {
            console.error("[stripe/webhook] No client_reference_id in session");
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        // Retrieve subscription details from Stripe
        const subscriptionId = session.subscription as string | null;
        let subscriptionStatus: string = "active";
        let currentPeriodEnd: string | null = null;

        if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = sub.status;
            const item = sub.items.data[0];
            if (item) {
                currentPeriodEnd = new Date(item.current_period_end * 1000).toISOString();
            }
        }

        const { error } = await supabase
            .from("profiles")
            .update({
                plan_tier: "pro",
                stripe_customer_id: session.customer as string,
                subscription_status: subscriptionStatus,
                current_period_end: currentPeriodEnd,
            })
            .eq("id", userId);

        if (error) {
            console.error("[stripe/webhook] Failed to update profile:", error.message);
            return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }

        console.log(`[stripe/webhook] User ${userId} upgraded to pro`);
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error } = await supabase
            .from("profiles")
            .update({
                plan_tier: "free",
                subscription_status: "canceled",
            })
            .eq("stripe_customer_id", customerId);

        if (error) {
            console.error("[stripe/webhook] Failed to downgrade profile:", error.message);
            return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }

        console.log(`[stripe/webhook] Customer ${customerId} downgraded to free`);
    }

    return NextResponse.json({ received: true });
}

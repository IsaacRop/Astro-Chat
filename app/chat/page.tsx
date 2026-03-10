'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

/**
 * Public Chat Page - Redirects to authenticated chat
 * 
 * This page previously used localStorage for unauthenticated users.
 * Now it enforces authentication - users must log in to use chat.
 * All data is persisted in Supabase (Single Source of Truth).
 */
export default function ChatPage() {
    const router = useRouter();

    useEffect(() => {
        async function checkAuthAndRedirect() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Authenticated: redirect to dashboard chat
                router.replace('/dashboard/chat');
            } else {
                // Not authenticated: redirect to home for login
                router.replace('/?redirect=chat');
            }
        }

        checkAuthAndRedirect();
    }, [router]);

    // Show loading while checking auth
    return (
        <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col items-center justify-center text-center p-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-border bg-card flex items-center justify-center mb-4 md:mb-6 flex-shrink-0">
                <MessageCircle size={26} className="text-muted-foreground" />
            </div>
            <Loader2 size={22} className="text-muted-foreground animate-spin mb-3 md:mb-4" />
            <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
    );
}

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
        <div className="h-screen h-[100dvh] bg-[#0C0C0D] flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-full border border-white/[0.05] bg-[#1A1A1C] flex items-center justify-center mb-6">
                <MessageCircle size={28} className="text-zinc-400" />
            </div>
            <Loader2 size={24} className="text-zinc-500 animate-spin mb-4" />
            <p className="text-zinc-500 text-sm">Redirecionando...</p>
        </div>
    );
}

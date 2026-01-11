"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Loader2, Lock } from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogPortal,
    DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LoginButton } from "@/components/LoginButton";
import { cn } from "@/lib/utils";

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Check initial session
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                setSession(currentSession);
            } else {
                setSession(null);
            }
            setIsLoading(false);
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession);
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Loading state - full screen spinner
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0C0C0D]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    // Authenticated - render children normally
    if (session) {
        return <>{children}</>;
    }

    // Not authenticated - show blurred interface with login modal
    return (
        <>
            {/* Blurred, non-interactive background */}
            <div className="blur-sm pointer-events-none select-none">
                {children}
            </div>

            {/* Non-dismissible login modal */}
            <Dialog open={true} onOpenChange={() => { }}>
                <DialogPortal>
                    <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
                    <DialogPrimitive.Content
                        className={cn(
                            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%]",
                            "gap-6 border border-white/10 bg-[#1A1A1C]/95 backdrop-blur-xl p-8 shadow-2xl rounded-2xl",
                            "data-[state=open]:animate-in data-[state=closed]:animate-out",
                            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
                            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
                        )}
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                    >
                        <DialogHeader className="text-center sm:text-center">
                            {/* Lock Icon */}
                            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                <Lock className="w-8 h-8 text-indigo-400" />
                            </div>

                            <DialogTitle className="text-xl font-semibold text-zinc-100">
                                Acesso Restrito
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 mt-2">
                                Para salvar seu progresso e usar as ferramentas do Otto, você precisa estar conectado.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 mt-2">
                            <LoginButton
                                nextUrl={typeof window !== "undefined" ? window.location.pathname : "/dashboard"}
                                className="w-full justify-center"
                            />

                            <Link
                                href="/"
                                className={cn(
                                    "flex items-center justify-center gap-2 px-6 py-3 w-full",
                                    "bg-transparent border border-white/10 text-zinc-400 rounded-xl font-medium",
                                    "transition-all duration-200 hover:bg-white/5 hover:text-zinc-200"
                                )}
                            >
                                Voltar para Home
                            </Link>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPortal>
            </Dialog>
        </>
    );
}

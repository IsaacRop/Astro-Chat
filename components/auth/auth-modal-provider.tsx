"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { LoginButton } from "@/components/LoginButton";

// ── Context ──────────────────────────────────────────────────────────────────

interface AuthModalContextValue {
    isAuthenticated: boolean;
    /** Execute `callback` if authenticated, otherwise open the login modal. */
    requireAuth: (callback?: () => void) => void;
    openModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
    const ctx = useContext(AuthModalContext);
    if (!ctx) throw new Error("useAuthModal must be used inside <AuthModalProvider>");
    return ctx;
}

// ── Login Modal ───────────────────────────────────────────────────────────────

function LoginModal({ onClose }: { onClose: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                {/* Dark overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative z-10 bg-popover border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                >
                    {/* Decorative gradient header */}
                    <div className="relative h-28 bg-gradient-to-br from-[#4A9E6B] via-[#5B9E9E] to-[#3B8558] overflow-hidden">
                        {/* Decorative orbs */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                        <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-white/10 blur-lg" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                                <span className="text-white font-serif font-bold text-2xl leading-none select-none">O</span>
                            </div>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="p-8 pt-6">
                        <h2 className="text-center text-2xl font-serif font-bold text-foreground mb-2">
                            Bem-vindo ao Otto
                        </h2>
                        <p className="text-center text-sm text-muted-foreground mb-8 leading-relaxed max-w-xs mx-auto">
                            Crie sua conta ou faça login para começar a aprender com o seu assistente de estudos pessoal.
                        </p>

                        <LoginButton
                            nextUrl={typeof window !== "undefined" ? window.location.pathname : "/"}
                            className="w-full justify-center shadow-sm border border-border"
                        />

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-popover px-3 text-muted-foreground">ou</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full text-muted-foreground hover:text-foreground text-sm py-2.5 rounded-xl border border-border hover:bg-muted/50 transition-all duration-150 font-medium"
                        >
                            Continuar navegando
                        </button>

                        <p className="text-center text-[11px] text-muted-foreground/60 mt-5 leading-relaxed">
                            Ao entrar, você concorda com os nossos Termos de Uso e Política de Privacidade.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthModalProviderProps {
    children: ReactNode;
    /**
     * Server-resolved auth state passed from the root layout.
     * Prevents flash where authenticated users briefly see the modal
     * before the client-side Supabase check completes.
     */
    initialIsAuthenticated?: boolean;
}

export function AuthModalProvider({
    children,
    initialIsAuthenticated = false,
}: AuthModalProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        // Verify with the server (more secure than trusting the initial cookie alone)
        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsAuthenticated(!!user);
        });

        // Keep in sync with real-time auth events (sign-in / sign-out / token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session?.user);
            if (session?.user) {
                // Auto-close the modal on successful login
                setIsModalOpen(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const openModal = useCallback(() => setIsModalOpen(true), []);

    const requireAuth = useCallback(
        (callback?: () => void) => {
            if (isAuthenticated) {
                callback?.();
            } else {
                setIsModalOpen(true);
            }
        },
        [isAuthenticated],
    );

    return (
        <AuthModalContext.Provider value={{ isAuthenticated, requireAuth, openModal }}>
            {children}
            {isModalOpen && <LoginModal onClose={() => setIsModalOpen(false)} />}
        </AuthModalContext.Provider>
    );
}

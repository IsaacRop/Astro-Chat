'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function CookieBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent')
        if (!consent) setVisible(true)
    }, [])

    function handleConsent(granted: boolean) {
        const value = granted ? 'granted' : 'denied'
        localStorage.setItem('cookie_consent', value)
        document.cookie = `cookie_consent=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
        setVisible(false)
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50
                               bg-[var(--surface,#FFFFFF)] border border-[var(--border,#D0E0D6)]
                               rounded-2xl shadow-lg p-4 flex flex-col md:flex-row items-start
                               md:items-center gap-4"
                >
                    <p className="text-sm text-[var(--text-sec,#5A7565)] flex-1">
                        O Otto usa cookies para manter sua sessão ativa e melhorar a experiência.
                        Conforme a <strong className="text-[var(--foreground,#1E2E25)]">LGPD</strong>, você pode aceitar ou recusar.
                    </p>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => handleConsent(false)}
                            className="text-sm px-4 py-2 rounded-xl border border-[var(--border,#D0E0D6)]
                                       text-[var(--text-sec,#5A7565)] hover:bg-[var(--surface-alt,#EDF4EF)]
                                       transition-colors duration-150 cursor-pointer"
                        >
                            Recusar
                        </button>
                        <button
                            onClick={() => handleConsent(true)}
                            className="text-sm px-4 py-2 rounded-xl bg-primary
                                       text-primary-foreground font-medium hover:opacity-90
                                       transition-opacity duration-150 cursor-pointer"
                        >
                            Aceitar
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

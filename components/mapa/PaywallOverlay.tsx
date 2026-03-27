'use client'

import { motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function PaywallOverlay() {
  return (
    <motion.div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="absolute inset-0 rounded-2xl backdrop-blur-md bg-background/60" />
      <motion.div
        className="relative z-10 mx-4 w-full max-w-xs rounded-3xl border border-border bg-card p-8 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 250, damping: 20 }}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15">
          <Lock size={28} className="text-[var(--color-primary)]" strokeWidth={2} />
        </div>
        <h3 className="mb-2 text-xl font-black">Mapa de Desenvolvimento</h3>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Visualize seu progresso em todas as competências do ENEM, suba de nível e acompanhe sua evolução em tempo real.
        </p>
        <ul className="mb-6 space-y-2 text-left text-sm">
          {[
            'Grid de hexágonos com 30 competências',
            'Sistema de XP e 10 níveis (Calouro → Lenda)',
            'Conquistas e animações de level up',
            'Progresso por área do ENEM',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-muted-foreground">
              <Sparkles size={13} className="text-[var(--color-primary)] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <Link href="/planos"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3.5 font-bold text-white transition-opacity hover:opacity-90">
          <Sparkles size={16} />
          Assinar Otto Pro
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">R$19,90/mês · Cancele quando quiser</p>
      </motion.div>
    </motion.div>
  )
}

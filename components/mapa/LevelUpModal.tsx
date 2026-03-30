'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { getNivelInfo } from '@/lib/xp/constants'
import type { AddXPResult } from '@/lib/xp/constants'

interface LevelUpModalProps {
  event: AddXPResult | null
  onClose: () => void
}

function ConfettiPiece({ i }: { i: number }) {
  const colors = ['#4ADE80', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#34D399']
  const color  = colors[i % colors.length]
  const x      = `${(i * 37) % 100}%`
  const delay  = (i * 0.07) % 1
  const size   = 6 + (i % 5) * 2

  return (
    <motion.div
      className="pointer-events-none absolute top-0 rounded-sm"
      style={{ left: x, width: size, height: size, backgroundColor: color }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: 320, opacity: 0, rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
      transition={{ duration: 2 + delay, delay, ease: 'easeIn' }}
    />
  )
}

export function LevelUpModal({ event, onClose }: LevelUpModalProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (event) {
      timerRef.current = setTimeout(onClose, 4000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [event, onClose])

  if (!event) return null

  const novoNivel = getNivelInfo(event.nivel_global)

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <ConfettiPiece key={i} i={i} />
            ))}
          </div>
          <motion.div
            className="relative z-10 mx-4 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl"
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4ADE80] via-[#60A5FA] to-[#F472B6]" />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
            <div className="px-8 py-10 text-center">
              <motion.div
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-primary)]/5"
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Sparkles size={44} className="text-[var(--color-primary)]" strokeWidth={1.5} />
              </motion.div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nível {event.nivel_global} desbloqueado
              </p>
              <motion.h2
                className="mb-2 text-4xl font-black tracking-tight"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring' }}
              >
                {novoNivel.titulo}
              </motion.h2>
              <p className="text-sm text-muted-foreground">
                Você evoluiu de <strong>{getNivelInfo(event.nivel_anterior).titulo}</strong> para{' '}
                <strong className="text-[var(--color-primary)]">{novoNivel.titulo}</strong>. Continue assim!
              </p>
              <div className="mt-6 rounded-xl bg-muted/50 px-4 py-2.5">
                <p className="text-sm font-semibold">
                  {event.xp_total.toLocaleString('pt-BR')} XP acumulados
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

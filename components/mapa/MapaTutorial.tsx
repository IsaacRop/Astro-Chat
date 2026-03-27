'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Map, Trophy, ChevronRight, X } from 'lucide-react'

const STEPS = [
  {
    icone: <Map size={36} strokeWidth={1.5} className="text-[var(--color-primary)]" />,
    titulo: 'Seu Mapa de Desenvolvimento',
    texto: 'Este é o coração do Otto. Cada hexágono representa uma competência do ENEM. Conforme você estuda, elas ganham vida.',
  },
  {
    icone: <Zap size={36} strokeWidth={1.5} className="text-yellow-400" />,
    titulo: 'Ganhe XP ao estudar',
    texto: 'Cada mensagem no chat vale +1 XP. Questões resolvidas, flashcards e sequências diárias também geram XP e desbloqueiam competências.',
  },
  {
    icone: <Trophy size={36} strokeWidth={1.5} className="text-orange-400" />,
    titulo: 'Suba de nível',
    texto: 'De Calouro a Lenda: há 10 níveis para conquistar. Ao subir de nível, você recebe uma animação especial e desbloqueiam novas competências.',
  },
]

export function MapaTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl mx-4"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <div className="flex gap-1 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
              <motion.div className="h-full bg-[var(--color-primary)]"
                animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
        <AnimatePresence mode="wait">
          <motion.div key={step} className="px-8 py-8 text-center"
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60">
              {current.icone}
            </div>
            <h3 className="mb-3 text-xl font-black">{current.titulo}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{current.texto}</p>
          </motion.div>
        </AnimatePresence>
        <div className="px-6 pb-8">
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3.5 font-bold text-white transition-opacity hover:opacity-90"
          >
            {isLast ? 'Começar a explorar' : 'Próximo'}
            <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { AREAS, calcularProgresso, getNivelInfo, getProximoNivel, type AreaSlug } from '@/lib/xp/constants'

interface AreaCardProps {
  slug: AreaSlug; xp: number; nivel: number
  delay?: number; onClick?: () => void
}

export function AreaCard({ slug, xp, nivel, delay = 0, onClick }: AreaCardProps) {
  const area    = AREAS[slug]
  const info    = getNivelInfo(nivel)
  const proximo = getProximoNivel(nivel)
  const prog    = calcularProgresso(xp, nivel)

  return (
    <motion.button type="button" onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: `${area.cor}22` }}>
          {area.icone}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{area.nome}</p>
          <p className="text-xs text-muted-foreground">Nível {nivel} · {info.titulo}</p>
        </div>
        <div className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: `${area.cor}22`, color: area.cor }}>
          {xp} XP
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: area.cor }}
          initial={{ width: 0 }} animate={{ width: `${prog * 100}%` }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: 'easeOut' }}
        />
      </div>
      {proximo && (
        <p className="mt-1.5 text-right text-xs text-muted-foreground">Próximo: {proximo.titulo}</p>
      )}
    </motion.button>
  )
}

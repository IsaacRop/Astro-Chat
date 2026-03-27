'use client'

import { motion } from 'framer-motion'
import { Zap, Flame } from 'lucide-react'
import { calcularProgresso, getNivelInfo, getProximoNivel } from '@/lib/xp/constants'
import type { UserXPData } from '@/lib/xp/constants'

interface XPBarProps {
  xp: UserXPData
  compact?: boolean
}

export function XPBar({ xp, compact = false }: XPBarProps) {
  const nivel     = xp.nivel_global
  const info      = getNivelInfo(nivel)
  const proximo   = getProximoNivel(nivel)
  const progresso = calcularProgresso(xp.xp_total, nivel)
  const xpAtual   = xp.xp_total - info.xpNecessario
  const xpNeeded  = proximo ? proximo.xpNecessario - info.xpNecessario : 0

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
          <Zap size={12} />
          <span>{xp.xp_total} XP</span>
        </div>
        <div className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--color-primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${progresso * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs text-muted-foreground">Nv.{nivel}</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/15">
            <Zap size={18} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">{info.titulo}</p>
            <p className="text-xs text-muted-foreground">Nível {nivel}</p>
          </div>
        </div>
        {xp.streak_atual > 0 && (
          <div className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2.5 py-1">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-bold text-orange-500">{xp.streak_atual}</span>
          </div>
        )}
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {xpAtual} / {xpNeeded > 0 ? xpNeeded : '—'} XP
          </span>
          {proximo && (
            <span className="text-xs text-muted-foreground">Próximo: {proximo.titulo}</span>
          )}
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark,var(--color-primary))]"
            initial={{ width: 0 }}
            animate={{ width: `${progresso * 100}%` }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        {xp.xp_total.toLocaleString('pt-BR')} XP total acumulado
      </p>
    </div>
  )
}

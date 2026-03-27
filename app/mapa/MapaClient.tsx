'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Flame, Map, BookOpen } from 'lucide-react'
import Link from 'next/link'

import { HexGrid }        from '@/components/mapa/HexGrid'
import { XPBar }          from '@/components/mapa/XPBar'
import { AreaCard }       from '@/components/mapa/AreaCard'
import { LevelUpModal }   from '@/components/mapa/LevelUpModal'
import { MapaTutorial }   from '@/components/mapa/MapaTutorial'
import { PaywallOverlay } from '@/components/mapa/PaywallOverlay'
import { useXP }          from '@/hooks/useXP'
import { AREAS, type AreaSlug } from '@/lib/xp/constants'
import type { UserXPData } from '@/lib/xp/constants'

const TUTORIAL_KEY = 'otto_mapa_tutorial_done'

interface Competencia {
  id: number; area_id: number; codigo: string; nome: string
}

interface MapaClientProps {
  isPro:        boolean
  initialXP:    unknown
  competencias: Competencia[]
}

export function MapaClient({ isPro, initialXP, competencias }: MapaClientProps) {
  const { xp, loading, levelUpEvent, clearLevelUp } = useXP()
  const [showTutorial, setShowTutorial] = useState(false)
  const [selectedArea, setSelectedArea] = useState<AreaSlug | null>(null)

  useEffect(() => {
    if (!isPro) return
    const done = localStorage.getItem(TUTORIAL_KEY)
    if (!done) {
      const t = setTimeout(() => setShowTutorial(true), 600)
      return () => clearTimeout(t)
    }
  }, [isPro])

  function handleCloseTutorial() {
    localStorage.setItem(TUTORIAL_KEY, '1')
    setShowTutorial(false)
  }

  const areasSlugs = Object.keys(AREAS) as AreaSlug[]
  const xpData = (xp ?? initialXP) as UserXPData | null

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="flex items-center gap-2 font-black text-lg">
            <Map size={20} className="text-[var(--color-primary)]" />
            Mapa
          </div>
          <div className="flex-1">
            {xpData && <XPBar xp={xpData} compact />}
          </div>
          <Link
            href="/cadernos"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground transition-colors duration-150 shrink-0"
          >
            <BookOpen size={14} />
            Cadernos
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
        {xpData && !loading && <XPBar xp={xpData} />}

        {!xpData && !loading && isPro && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Comece uma conversa no chat para ganhar XP e desbloquear o mapa!
          </div>
        )}

        {/* Grid de hexágonos */}
        <div className="relative rounded-2xl border border-border bg-card p-4 overflow-hidden">
          <HexGrid
            userXP={xpData}
            competencias={competencias}
            onSelectArea={setSelectedArea}
          />
          {!isPro && <PaywallOverlay />}
        </div>

        {/* Cards por área */}
        {isPro && xpData && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Progresso por Área
            </h2>
            <div className="space-y-2">
              {areasSlugs.map((slug, i) => (
                <AreaCard
                  key={slug}
                  slug={slug}
                  xp={xpData.xp_por_area[slug] ?? 0}
                  nivel={xpData.nivel_por_area[slug] ?? 1}
                  delay={i * 0.07}
                  onClick={() => setSelectedArea(slug)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Streak */}
        {isPro && xpData && xpData.streak_atual > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
            <Flame size={22} className="text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-bold">
                {xpData.streak_atual} {xpData.streak_atual === 1 ? 'dia' : 'dias'} consecutivos!
              </p>
              <p className="text-xs text-muted-foreground">
                Melhor sequência: {xpData.streak_maximo} dias · +5 XP por dia de estudo
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <AnimatePresence>
        {showTutorial && <MapaTutorial onClose={handleCloseTutorial} />}
      </AnimatePresence>

      <LevelUpModal event={levelUpEvent} onClose={clearLevelUp} />
    </div>
  )
}

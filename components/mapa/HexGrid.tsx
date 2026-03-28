'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { AREAS, NIVEIS, type UserXPData, type AreaSlug } from '@/lib/xp/constants'

interface Competencia {
  id: number
  area_id: number
  codigo: string
  nome: string
}

interface HexGridProps {
  userXP:        UserXPData | null
  competencias:  Competencia[]
  onSelectArea?: (area: AreaSlug) => void
}

const HEX_SIZE  = 52
const COMP_SIZE = 34

function hexCorners(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const rad = (Math.PI / 180) * (60 * i + 30)
    return `${cx + size * Math.cos(rad)},${cy + size * Math.sin(rad)}`
  }).join(' ')
}

const AREA_POSITIONS: Record<AreaSlug, [number, number]> = {
  lc: [200, 80],
  ch: [80,  190],
  mt: [320, 190],
  cn: [120, 340],
  rd: [280, 340],
}

function getCompPositions(cx: number, cy: number, count: number): [number, number][] {
  const radius = HEX_SIZE + COMP_SIZE + 12
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)] as [number, number]
  })
}

interface HexCellProps {
  cx: number; cy: number; size: number
  fill: string; stroke: string; opacity?: number
  locked?: boolean; label?: string; icone?: string
  nivel?: number; delay?: number; onClick?: () => void
}

function HexCell({ cx, cy, size, fill, stroke, opacity = 1, locked, label, icone, nivel, delay = 0, onClick }: HexCellProps) {
  const [hovered, setHovered] = useState(false)
  const pts = hexCorners(cx, cy, size)

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: locked ? 0.35 : opacity }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 18 }}
      style={{ cursor: locked ? 'default' : 'pointer', transformOrigin: `${cx}px ${cy}px` }}
      onMouseEnter={() => !locked && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !locked && onClick?.()}
      role={locked ? undefined : 'button'}
      tabIndex={locked ? undefined : 0}
      onKeyDown={(e) => { if (!locked && (e.key === 'Enter' || e.key === ' ')) onClick?.() }}
    >
      {hovered && (
        <polygon
          points={hexCorners(cx, cy, size + 4)}
          fill="none" stroke={fill} strokeWidth={3} opacity={0.4}
          style={{ filter: 'blur(4px)' }}
        />
      )}
      <motion.polygon
        points={pts} fill={fill} stroke={stroke}
        strokeWidth={hovered ? 2.5 : 1.5}
        animate={{ scale: hovered ? 1.06 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {locked ? (
        <foreignObject x={cx - 8} y={cy - 8} width={16} height={16}>
          <Lock size={14} color={stroke} />
        </foreignObject>
      ) : (
        <>
          {icone && (
            <text x={cx} y={cy - (label ? 10 : 4)} textAnchor="middle"
              fontSize={size > 35 ? 22 : 14} dominantBaseline="middle">
              {icone}
            </text>
          )}
          {label && (
            <text x={cx} y={cy + (icone ? 12 : 4)} textAnchor="middle"
              fontSize={size > 35 ? 11 : 7.5} fill="white" fontWeight="700" fontFamily="system-ui">
              {label.length > 12 ? label.slice(0, 12) + '…' : label}
            </text>
          )}
          {nivel !== undefined && (
            <text x={cx} y={cy + (size > 35 ? 24 : 16)} textAnchor="middle"
              fontSize={size > 35 ? 9 : 6.5} fill="rgba(255,255,255,0.7)" fontFamily="system-ui">
              Nv. {nivel}
            </text>
          )}
        </>
      )}
    </motion.g>
  )
}

export function HexGrid({ userXP, competencias, onSelectArea }: HexGridProps) {
  const areasSlugs = Object.keys(AREAS) as AreaSlug[]
  const areaIds: Record<AreaSlug, number> = { lc: 1, ch: 2, cn: 3, mt: 4, rd: 5 }

  const compsByArea = useMemo(() => {
    const map: Record<number, Competencia[]> = {}
    for (const c of competencias) {
      if (!map[c.area_id]) map[c.area_id] = []
      map[c.area_id].push(c)
    }
    return map
  }, [competencias])

  function compDesbloqueada(areaSlug: AreaSlug, idx: number, totalComps: number) {
    if (!userXP) return false
    const areaNivel = userXP.nivel_por_area[areaSlug] ?? 1
    const maxNivel = NIVEIS.length
    // Unlock competencies proportionally: at level N out of 10, unlock N/10 of total comps
    const unlocked = Math.floor((areaNivel / maxNivel) * totalComps)
    return idx < unlocked
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 400 460" className="w-full max-w-lg mx-auto" aria-label="Mapa de Desenvolvimento">
        {areasSlugs.map((slug, i) =>
          areasSlugs.slice(i + 1).map((slug2) => {
            const [x1, y1] = AREA_POSITIONS[slug]
            const [x2, y2] = AREA_POSITIONS[slug2]
            return (
              <line key={`${slug}-${slug2}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} strokeDasharray="4 4"
              />
            )
          })
        )}

        {areasSlugs.map((slug) => {
          const area = AREAS[slug]
          const comps = compsByArea[areaIds[slug]] ?? []
          const [cx, cy] = AREA_POSITIONS[slug]
          const positions = getCompPositions(cx, cy, comps.length)

          return comps.map((comp, idx) => {
            const [px, py] = positions[idx]
            const desbloqueada = compDesbloqueada(slug, idx, comps.length)
            return (
              <HexCell key={comp.id}
                cx={px} cy={py} size={COMP_SIZE}
                fill={desbloqueada ? `${area.cor}40` : '#1a1a2e'}
                stroke={desbloqueada ? area.cor : '#333355'}
                locked={!desbloqueada}
                label={comp.codigo}
                delay={0.05 * idx + 0.2}
              />
            )
          })
        })}

        {areasSlugs.map((slug, i) => {
          const area = AREAS[slug]
          const [cx, cy] = AREA_POSITIONS[slug]
          const nivel = userXP?.nivel_por_area[slug] ?? 1
          return (
            <HexCell key={slug}
              cx={cx} cy={cy} size={HEX_SIZE}
              fill={`${area.corDark}CC`} stroke={area.cor}
              icone={area.icone} label={area.nome} nivel={nivel}
              delay={0.1 * i}
              onClick={() => onSelectArea?.(slug)}
            />
          )
        })}
      </svg>
    </div>
  )
}

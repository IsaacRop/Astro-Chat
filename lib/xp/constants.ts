export const XP_SOURCES = {
  chat_message: 1,
  flashcard:    2,
  streak:       5,
  questao:      10,
  simulado:     50,
} as const

export type XPSource = keyof typeof XP_SOURCES

export const AREAS = {
  lc: { slug: 'lc', nome: 'Linguagens',        cor: '#4ADE80', corDark: '#16A34A', icone: '📚' },
  ch: { slug: 'ch', nome: 'Ciências Humanas',  cor: '#60A5FA', corDark: '#2563EB', icone: '🌍' },
  cn: { slug: 'cn', nome: 'Ciências Natureza', cor: '#F472B6', corDark: '#DB2777', icone: '🔬' },
  mt: { slug: 'mt', nome: 'Matemática',        cor: '#FBBF24', corDark: '#D97706', icone: '📐' },
  rd: { slug: 'rd', nome: 'Redação',           cor: '#A78BFA', corDark: '#7C3AED', icone: '✍️' },
} as const

export type AreaSlug = keyof typeof AREAS

export const NIVEIS: Array<{ nivel: number; titulo: string; xpNecessario: number }> = [
  { nivel: 1,  titulo: 'Calouro',   xpNecessario: 0    },
  { nivel: 2,  titulo: 'Estudante', xpNecessario: 175  },
  { nivel: 3,  titulo: 'Dedicado',  xpNecessario: 386  },
  { nivel: 4,  titulo: 'Focado',    xpNecessario: 657  },
  { nivel: 5,  titulo: 'Veterano',  xpNecessario: 989  },
  { nivel: 6,  titulo: 'Avançado',  xpNecessario: 1382 },
  { nivel: 7,  titulo: 'Expert',    xpNecessario: 1835 },
  { nivel: 8,  titulo: 'Mestre',    xpNecessario: 2347 },
  { nivel: 9,  titulo: 'Gênio',     xpNecessario: 2917 },
  { nivel: 10, titulo: 'Lenda',     xpNecessario: 3545 },
]

export function calcularNivel(xp: number): number {
  let nivel = 1
  for (const n of NIVEIS) {
    if (xp >= n.xpNecessario) nivel = n.nivel
    else break
  }
  return nivel
}

export function getNivelInfo(nivel: number) {
  return NIVEIS.find(n => n.nivel === nivel) ?? NIVEIS[0]
}

export function getProximoNivel(nivel: number) {
  return NIVEIS.find(n => n.nivel === nivel + 1) ?? null
}

export function calcularProgresso(xp: number, nivel: number): number {
  const atual   = getNivelInfo(nivel)
  const proximo = getProximoNivel(nivel)
  if (!proximo) return 1
  const range = proximo.xpNecessario - atual.xpNecessario
  const ganho = xp - atual.xpNecessario
  return Math.min(1, Math.max(0, ganho / range))
}

export interface UserXPData {
  xp_total:       number
  nivel_global:   number
  xp_por_area:    Record<AreaSlug, number>
  nivel_por_area: Record<AreaSlug, number>
  streak_atual:   number
  streak_maximo:  number
}

export interface AddXPResult {
  xp_total:         number
  nivel_global:     number
  nivel_anterior:   number
  subiu_nivel:      boolean
  xp_por_area:      Record<AreaSlug, number>
  nivel_por_area:   Record<AreaSlug, number>
  streak_atual:     number
  conquistas_novas: string[]
}

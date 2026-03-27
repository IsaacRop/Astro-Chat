'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  calcularNivel,
  calcularProgresso,
  getNivelInfo,
  getProximoNivel,
  type UserXPData,
  type AddXPResult,
} from '@/lib/xp/constants'

interface UseXPReturn {
  xp:              UserXPData | null
  loading:         boolean
  levelUpEvent:    AddXPResult | null
  clearLevelUp:    () => void
  progressoGlobal: number
  tituloAtual:     string
  tituloProximo:   string | null
  xpProximoNivel:  number | null
}

export function useXP(): UseXPReturn {
  const [xp, setXP]                     = useState<UserXPData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [levelUpEvent, setLevelUpEvent] = useState<AddXPResult | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) setXP(data as UserXPData)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('xp-realtime')
        .on(
          'postgres_changes',
          {
            event:  'UPDATE',
            schema: 'public',
            table:  'user_xp',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const novo     = payload.new as UserXPData
            const anterior = xp?.nivel_global ?? 1

            setXP(novo)

            if (novo.nivel_global > anterior) {
              setLevelUpEvent({
                xp_total:         novo.xp_total,
                nivel_global:     novo.nivel_global,
                nivel_anterior:   anterior,
                subiu_nivel:      true,
                xp_por_area:      novo.xp_por_area,
                nivel_por_area:   novo.nivel_por_area,
                streak_atual:     novo.streak_atual,
                conquistas_novas: [],
              })
            }
          }
        )
        .subscribe()
    }

    subscribe()
    return () => { channel?.unsubscribe() }
  }, [xp?.nivel_global])

  const clearLevelUp = useCallback(() => setLevelUpEvent(null), [])

  const nivel        = xp ? calcularNivel(xp.xp_total) : 1
  const progresso    = xp ? calcularProgresso(xp.xp_total, nivel) : 0
  const nivelInfo    = getNivelInfo(nivel)
  const proximoNivel = getProximoNivel(nivel)

  return {
    xp,
    loading,
    levelUpEvent,
    clearLevelUp,
    progressoGlobal: progresso,
    tituloAtual:     nivelInfo.titulo,
    tituloProximo:   proximoNivel?.titulo ?? null,
    xpProximoNivel:  proximoNivel?.xpNecessario ?? null,
  }
}

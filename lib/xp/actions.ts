'use server'

import { createClient } from '@/utils/supabase/server'
import type { XPSource, AreaSlug, AddXPResult } from './constants'
import { XP_SOURCES } from './constants'

export async function addXP(
  source: XPSource,
  areaSlug?: AreaSlug,
  metadata?: Record<string, unknown>
): Promise<AddXPResult | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const amount = XP_SOURCES[source]

  const { data, error } = await supabase.rpc('add_xp', {
    p_user_id:   user.id,
    p_source:    source,
    p_amount:    amount,
    p_area_slug: areaSlug ?? null,
    p_metadata:  metadata ? JSON.stringify(metadata) : null,
  })

  if (error) {
    console.error('[addXP] Supabase RPC error:', error)
    return null
  }

  return data as unknown as AddXPResult
}

export async function getUserXP() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_xp')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[getUserXP]', error)
    return null
  }

  return data
}

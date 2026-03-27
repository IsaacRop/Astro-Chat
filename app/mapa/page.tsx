import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { MapaClient } from './MapaClient'

export const metadata = {
  title: 'Mapa de Desenvolvimento · Otto',
  description: 'Visualize seu progresso nas competências do ENEM',
}

export default async function MapaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan_tier === 'pro'

  const { data: userXP } = await supabase
    .from('user_xp')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: competencias } = await supabase
    .from('enem_competencias')
    .select('id, area_id, codigo, nome')
    .order('id')

  return (
    <MapaClient
      isPro={isPro}
      initialXP={userXP}
      competencias={competencias ?? []}
    />
  )
}

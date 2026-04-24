import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function getUserByAuth0Id(auth0Id) {
  const { data } = await supabase
    .from('users').select('*').eq('auth0_id', auth0Id).single()
  return data
}

export async function upsertUser(auth0Id) {
  const { data } = await supabase
    .from('users')
    .upsert({ auth0_id: auth0Id }, { onConflict: 'auth0_id' })
    .select().single()
  return data
}

export async function logCravingEvent(userId, eventData) {
  const { data } = await supabase
    .from('craving_events')
    .insert({ user_id: userId, ...eventData })
    .select().single()
  return data
}

export async function updateSparkResonance(userId, category, delta) {
  const { data: existing } = await supabase
    .from('spark_profile').select('resonance_score, times_completed')
    .eq('user_id', userId).eq('category', category).single()

  if (existing) {
    await supabase.from('spark_profile').update({
      resonance_score: existing.resonance_score + delta,
      times_completed: existing.times_completed + 1,
      last_used: new Date().toISOString()
    }).eq('user_id', userId).eq('category', category)
  } else {
    await supabase.from('spark_profile')
      .insert({ user_id: userId, category, resonance_score: delta, times_completed: 1 })
  }
}

export async function getSparkProfile(userId) {
  const { data } = await supabase
    .from('spark_profile').select('*').eq('user_id', userId)
  const profile = {}
  data?.forEach(row => { profile[row.category] = row.resonance_score })
  return profile
}

export async function getFlaggedTriggers(userId) {
  const { data } = await supabase
    .from('flagged_triggers').select('topic').eq('user_id', userId)
  return data?.map(r => r.topic) || []
}

export async function addFlaggedTrigger(userId, topic, reason = 'ai_detected') {
  await supabase.from('flagged_triggers')
    .insert({ user_id: userId, topic, reason })
}

export async function getSupportCircle(userId) {
  const { data } = await supabase
    .from('support_circle').select('*').eq('user_id', userId)
  return data || []
}

export async function getCravingHistory(userId, limit = 30) {
  const { data } = await supabase
    .from('craving_events').select('*')
    .eq('user_id', userId).order('triggered_at', { ascending: false }).limit(limit)
  return data || []
}

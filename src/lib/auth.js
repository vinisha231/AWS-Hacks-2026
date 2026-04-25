import { supabase } from './supabase'

const domain = 'ember.app'

function toEmail(username) {
  return `${username.toLowerCase().trim()}@${domain}`
}

export async function signUp(username, password) {
  const email = toEmail(username)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })
  if (error) throw error
  return data
}

export async function signIn(username, password) {
  const email = toEmail(username)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function getUsername(session) {
  return session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Anonymous'
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session)
  })
}

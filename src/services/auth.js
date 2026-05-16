/**
 * Auth service — Cognito-compatible interface.
 * Swap the localStorage implementation below with:
 *   import { Auth } from 'aws-amplify'
 *   and configure Amplify with VITE_COGNITO_USER_POOL_ID + VITE_COGNITO_CLIENT_ID
 * to go fully live. The API key (VITE_API_KEY) is forwarded as x-api-key on all
 * requests to the API Gateway endpoints.
 */

export const API_KEY   = import.meta.env.VITE_API_KEY
export const API_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1'

const USERS_KEY   = 'compass_users_v1'
const SESSION_KEY = 'compass_session_v1'
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch { return {} }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)) }

export async function signUp({ email, password, name }) {
  const users = getUsers()
  if (users[email?.toLowerCase()]) throw new Error('An account with this email already exists.')
  const key = email.toLowerCase()
  users[key] = { email: key, name, passwordHash: btoa(unescape(encodeURIComponent(password))), createdAt: new Date().toISOString() }
  saveUsers(users)
  return { email: key, name }
}

export async function signIn({ email, password }) {
  const users = getUsers()
  const key = email?.toLowerCase()
  const user = users[key]
  if (!user) throw new Error('No account found with that email.')
  const hash = btoa(unescape(encodeURIComponent(password)))
  if (user.passwordHash !== hash) throw new Error('Incorrect password.')
  const session = {
    email: key,
    name: user.name,
    token: btoa(key + '::' + Date.now()),
    expiresAt: Date.now() + SESSION_TTL,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s.expiresAt < Date.now()) { localStorage.removeItem(SESSION_KEY); return null }
    return s
  } catch { return null }
}

export function refreshSession() {
  const s = getSession()
  if (!s) return null
  s.expiresAt = Date.now() + SESSION_TTL
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  return s
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY)
}

export async function deleteAccount(email) {
  const users = getUsers()
  delete users[email?.toLowerCase()]
  saveUsers(users)
  localStorage.removeItem(SESSION_KEY)
}

export async function updatePassword({ email, oldPassword, newPassword }) {
  const users = getUsers()
  const key = email?.toLowerCase()
  const user = users[key]
  if (!user) throw new Error('Account not found.')
  const oldHash = btoa(unescape(encodeURIComponent(oldPassword)))
  if (user.passwordHash !== oldHash) throw new Error('Current password is incorrect.')
  users[key].passwordHash = btoa(unescape(encodeURIComponent(newPassword)))
  saveUsers(users)
}

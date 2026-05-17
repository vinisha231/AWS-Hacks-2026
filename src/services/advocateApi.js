const API_BASE = import.meta.env.VITE_API_ENDPOINT
const API_KEY = import.meta.env.VITE_API_KEY
const SESSION_STORAGE_KEY = 'compass_ai_session_id'

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `session_${Math.random().toString(36).slice(2)}_${Date.now()}`
      localStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  } catch (err) {
    return `session_${Math.random().toString(36).slice(2)}_${Date.now()}`
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, options, retries = 3) {
  let attempt = 0
  while (attempt < retries) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      if (!response.ok) {
        const bodyText = await response.text().catch(() => '')
        const error = new Error(`API error ${response.status}${bodyText ? `: ${bodyText}` : ''}`)
        error.status = response.status
        if (response.status >= 500 && attempt < retries - 1) {
          await delay(300 * 2 ** attempt)
          attempt += 1
          continue
        }
        throw error
      }
      return response.json()
    } catch (err) {
      clearTimeout(timer)
      const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('aborted')
      const isNetwork = err.message?.toLowerCase().includes('failed to fetch') || err.message?.toLowerCase().includes('network')
      const isAuth = err.message?.includes('401') || err.message?.includes('403')
      if (attempt < retries - 1 && (isNetwork || isTimeout || (err.status >= 500 && err.status < 600))) {
        await delay(300 * 2 ** attempt)
        attempt += 1
        continue
      }
      const reason = isAuth ? 'auth' : isTimeout ? 'timeout' : isNetwork ? 'network' : 'unknown'
      const wrapped = new Error(`Fetch failed (${reason}): ${err.message}`)
      wrapped.reason = reason
      wrapped.original = err
      throw wrapped
    }
  }
}

export async function generateLetter({ programName, programFull, userName, profile }) {
  if (!API_BASE) throw new Error('No API endpoint configured')
  return fetchWithRetry(`${API_BASE}/advocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'x-api-key': API_KEY } : {}) },
    body: JSON.stringify({
      mode: 'letter',
      program_name: programName,
      program_full: programFull,
      user_name: userName,
      profile,
      session_id: getSessionId(),
    }),
  })
}

export async function roleplayTurn({ programName, profile, message, history }) {
  if (!API_BASE) throw new Error('No API endpoint configured')
  return fetchWithRetry(`${API_BASE}/advocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'x-api-key': API_KEY } : {}) },
    body: JSON.stringify({
      mode: 'roleplay',
      program_name: programName,
      profile,
      message,
      history,
      session_id: getSessionId(),
    }),
  })
}

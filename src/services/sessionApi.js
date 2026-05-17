const API_BASE = import.meta.env.VITE_API_ENDPOINT
const API_KEY  = import.meta.env.VITE_API_KEY

const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
}

export async function saveSession({ answers, programs, meta }) {
  try {
    const res = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ answers, programs, meta }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getSession(id) {
  try {
    const res = await fetch(`${API_BASE}/session?id=${id}`, { headers })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const API_BASE = import.meta.env.VITE_API_ENDPOINT
const API_KEY  = import.meta.env.VITE_API_KEY

export async function generateLetter({ programName, programFull, userName, profile }) {
  const res = await fetch(`${API_BASE}/advocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'x-api-key': API_KEY } : {}) },
    body: JSON.stringify({ mode: 'letter', program_name: programName, program_full: programFull, user_name: userName, profile }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function roleplayTurn({ programName, profile, message, history }) {
  const res = await fetch(`${API_BASE}/advocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'x-api-key': API_KEY } : {}) },
    body: JSON.stringify({ mode: 'roleplay', program_name: programName, profile, message, history }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

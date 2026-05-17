const API_BASE = import.meta.env.VITE_API_ENDPOINT
const API_KEY  = import.meta.env.VITE_API_KEY

export async function chatWithBot(message, programId, programName) {
  if (!API_BASE) throw new Error('No API endpoint configured')

  const response = await fetch(`${API_BASE}/chatbot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({ message, program_id: programId, program_name: programName || programId }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

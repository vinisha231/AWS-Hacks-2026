const BASE = 'http://localhost:3001/api/elevenlabs'

export async function playVoiceMessage(text, voiceId) {
  const response = await fetch(`${BASE}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId })
  })

  if (!response.ok) throw new Error(`Voice API ${response.status}`)

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)

  return new Promise((resolve, reject) => {
    audio.onended = () => { URL.revokeObjectURL(url); resolve() }
    audio.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    audio.play().catch(reject)
  })
}

export async function cloneVoice(personName, files) {
  const form = new FormData()
  form.append('personName', personName)
  Array.from(files).forEach(f => form.append('samples', f))
  const res = await fetch(`${BASE}/clone-voice`, { method: 'POST', body: form })
  return res.json()
}

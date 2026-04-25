const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

// Global audio ref so any caller can interrupt playback
let _currentAudio = null
let _currentUrl = null

export function stopCurrentAudio() {
  if (_currentAudio) {
    _currentAudio.pause()
    _currentAudio.currentTime = 0
    _currentAudio = null
  }
  if (_currentUrl) {
    URL.revokeObjectURL(_currentUrl)
    _currentUrl = null
  }
}

export async function playVoiceMessage(text, voiceId) {
  stopCurrentAudio()

  const response = await fetch(`${BASE}/api/elevenlabs/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId })
  })
  if (!response.ok) throw new Error(`Voice API ${response.status}`)

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  _currentAudio = audio
  _currentUrl = url

  return new Promise((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (_currentAudio === audio) { _currentAudio = null; _currentUrl = null }
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      if (_currentAudio === audio) { _currentAudio = null; _currentUrl = null }
      resolve() // resolve not reject — don't break the flow on audio errors
    }
    audio.play().catch(() => resolve())
  })
}

export async function cloneVoice(personName, audioBlob) {
  const form = new FormData()
  form.append('personName', personName)
  form.append('samples', audioBlob, `${personName}.webm`)
  const res = await fetch(`${BASE}/api/elevenlabs/clone-voice`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Clone failed: ${res.status}`)
  return res.json()
}

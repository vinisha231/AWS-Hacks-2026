const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

let _currentAudio = null
let _currentUrl = null
let _currentAbort = null  // AbortController for in-flight fetch

export function stopCurrentAudio() {
  // Abort any in-flight fetch so audio never starts after stop is called
  if (_currentAbort) {
    _currentAbort.abort()
    _currentAbort = null
  }
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

  const controller = new AbortController()
  _currentAbort = controller

  try {
    const response = await fetch(`${BASE}/api/elevenlabs/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Voice API ${response.status}`)

    const blob = await response.blob()

    // If aborted while fetching, don't play
    if (controller.signal.aborted) return

    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    _currentAudio = audio
    _currentUrl = url
    _currentAbort = null

    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url)
        if (_currentAudio === audio) { _currentAudio = null; _currentUrl = null }
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        if (_currentAudio === audio) { _currentAudio = null; _currentUrl = null }
        resolve()
      }
      audio.play().catch(() => resolve())
    })
  } catch (err) {
    if (err.name === 'AbortError') return  // clean cancellation
    // don't rethrow — let callers continue even on audio failures
  }
}

export async function cloneVoice(personName, audioBlob) {
  const form = new FormData()
  form.append('personName', personName)
  form.append('samples', audioBlob, `${personName}.webm`)
  const res = await fetch(`${BASE}/api/elevenlabs/clone-voice`, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Clone failed: ${res.status}`)
  return data
}

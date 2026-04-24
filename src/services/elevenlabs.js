const BASE = 'http://localhost:3001/api/elevenlabs'

export async function playVoiceMessage(text, voiceId) {
  const response = await fetch(`${BASE}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId })
  })

  if (!response.ok) throw new Error('Voice API failed')

  const arrayBuffer = await response.arrayBuffer()
  const audioCtx = new AudioContext()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  const source = audioCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioCtx.destination)
  source.start(0)

  return new Promise(resolve => { source.onended = resolve })
}

export async function cloneVoice(personName, files) {
  const form = new FormData()
  form.append('personName', personName)
  Array.from(files).forEach(f => form.append('samples', f))

  const res = await fetch(`${BASE}/clone-voice`, {
    method: 'POST',
    body: form
  })
  return res.json()
}

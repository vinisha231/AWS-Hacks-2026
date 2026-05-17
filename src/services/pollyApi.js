const API_BASE = import.meta.env.VITE_API_ENDPOINT
const API_KEY  = import.meta.env.VITE_API_KEY

let currentAudio = null

export async function speakText(text, language = 'en') {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  const res = await fetch(`${API_BASE}/polly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({ text, language: language.slice(0, 2) }),
  })
  if (!res.ok) throw new Error(`Polly ${res.status}`)
  const { audio } = await res.json()
  const src = `data:audio/mpeg;base64,${audio}`
  currentAudio = new Audio(src)
  return currentAudio.play()
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

export function langToBCP47(lang) {
  const map = {
    en: 'en-US', es: 'es-US', fr: 'fr-FR', de: 'de-DE',
    zh: 'zh-CN', hi: 'hi-IN', ar: 'ar-SA', pt: 'pt-BR',
    ko: 'ko-KR', ja: 'ja-JP', ru: 'ru-RU', it: 'it-IT', nl: 'nl-NL',
    ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', vi: 'vi-VN',
    tr: 'tr-TR', pl: 'pl-PL', uk: 'uk-UA', sw: 'sw-KE',
  }
  return map[lang?.slice(0, 2)] || 'en-US'
}

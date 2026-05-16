const API_BASE = import.meta.env.VITE_API_ENDPOINT || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'x-api-key': API_KEY } : {})
}

let languageCache = null

export async function translateText(text, targetLang, sourceLang = 'en') {
  if (targetLang === sourceLang) return text
  if (!API_BASE) return text  // fallback: return original if no API configured

  const res = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, source: sourceLang, target: targetLang })
  })
  if (!res.ok) return text
  const data = await res.json()
  return data.translated ?? text
}

export async function getSupportedLanguages() {
  if (languageCache) return languageCache
  if (!API_BASE) return {}

  try {
    const res = await fetch(`${API_BASE}/translate/languages`, { headers })
    if (!res.ok) return {}
    const data = await res.json()
    languageCache = data.languages
    return languageCache
  } catch {
    return {}
  }
}

import { createContext, useContext, useEffect, useState } from 'react'
import { useStore } from '../store/store'
import { translations } from '../i18n/translations'

const TranslationContext = createContext({})

const CACHE_PREFIX = 'compass_t2_'
const STATIC_LANGS = new Set(['en', 'es'])
const API_BASE = import.meta.env.VITE_API_ENDPOINT || ''

function getCached(lang) {
  try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + lang)) } catch { return null }
}

function setCache(lang, dict) {
  try { localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(dict)) } catch {}
}

async function batchTranslate(texts, target) {
  const res = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, source: 'en', target })
  })
  if (!res.ok) throw new Error('translate failed')
  const data = await res.json()
  return data.translated // array
}

export function TranslationProvider({ children }) {
  const lang = useStore(s => s.language)
  const [dynamicDict, setDynamicDict] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (STATIC_LANGS.has(lang)) { setDynamicDict({}); setLoading(false); return }

    const cached = getCached(lang)
    if (cached) { setDynamicDict(cached); setLoading(false); return }

    if (!API_BASE) { setLoading(false); return }

    let alive = true
    setLoading(true)

    const enDict = translations.en
    const keys = Object.keys(enDict)
    const values = Object.values(enDict)

    // Single batch request — all strings at once
    batchTranslate(values, lang)
      .then(translated => {
        if (!alive) return
        const dict = Object.fromEntries(keys.map((k, i) => [k, translated[i]]))
        setCache(lang, dict)
        setDynamicDict(dict)
        setLoading(false)
      })
      .catch(err => {
        console.error('[Compass] Translation failed:', err)
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [lang])

  return (
    <TranslationContext.Provider value={{ dynamicDict, loading, lang }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useDynamicTranslations() {
  return useContext(TranslationContext)
}

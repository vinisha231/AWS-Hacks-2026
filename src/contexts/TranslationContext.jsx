import { createContext, useContext, useEffect, useState } from 'react'
import { useStore } from '../store/store'
import { translations } from '../i18n/translations'

const TranslationContext = createContext({})

const STATIC_LANGS = new Set(['en'])
// If VITE_API_ENDPOINT is set, use the deployed Lambda. Otherwise use a relative
// URL so requests hit the Vite dev-server plugin (awsTranslatePlugin in vite.config.js).
const API_BASE = import.meta.env.VITE_API_ENDPOINT || ''

const KEY_COUNT = Object.keys(translations.en).length
const CACHE_PREFIX = `compass_t_${KEY_COUNT}_`

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
  if (!res.ok) throw new Error(`translate failed: ${res.status}`)
  const data = await res.json()
  return data.translated
}

export function TranslationProvider({ children }) {
  const lang = useStore(s => s.language)
  const [dynamicDict, setDynamicDict] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (STATIC_LANGS.has(lang)) { setDynamicDict({}); setLoading(false); return }

    const cached = getCached(lang)
    if (cached) { setDynamicDict(cached); setLoading(false); return }

    let alive = true
    setLoading(true)

    const keys = Object.keys(translations.en)
    const values = Object.values(translations.en)

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
    <TranslationContext.Provider value={{ dynamicDict, loading, noApi: false, lang }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useDynamicTranslations() {
  return useContext(TranslationContext)
}

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useStore } from '../store/store'
import { translations } from '../i18n/translations'
import { translateText } from '../services/translate'

const TranslationContext = createContext({})

const CACHE_PREFIX = 'compass_translations_'
const STATIC_LANGS = new Set(['en', 'es'])

function getCached(lang) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + lang)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCache(lang, dict) {
  try { localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(dict)) } catch {}
}

export function TranslationProvider({ children }) {
  const lang = useStore(s => s.language)
  const [dynamicDict, setDynamicDict] = useState({})
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    // Static languages — no API call needed
    if (STATIC_LANGS.has(lang)) {
      setDynamicDict({})
      setLoading(false)
      return
    }

    // Check localStorage cache first
    const cached = getCached(lang)
    if (cached) {
      setDynamicDict(cached)
      setLoading(false)
      return
    }

    // Cancel any in-flight translation
    if (abortRef.current) abortRef.current = false
    const alive = { current: true }
    abortRef.current = alive.current

    setLoading(true)

    const enDict = translations.en
    const keys = Object.keys(enDict)
    const values = Object.values(enDict)

    // Batch translate all English strings to target language
    Promise.all(
      // Translate in chunks of 20 to avoid large payloads
      chunk(values, 20).map(batch =>
        Promise.all(batch.map(text => translateText(text, lang, 'en')))
      )
    ).then(results => {
      if (!alive.current) return
      const translated = results.flat()
      const dict = Object.fromEntries(keys.map((k, i) => [k, translated[i]]))
      setCache(lang, dict)
      setDynamicDict(dict)
      setLoading(false)
    }).catch(() => {
      if (!alive.current) return
      setLoading(false)
    })

    return () => { alive.current = false }
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

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

import { useCallback } from 'react'
import { useStore } from '../store/store'
import { t as staticTranslate } from '../i18n/translations'
import { translateText } from '../services/translate'

export function useTranslation() {
  const lang = useStore(s => s.language)

  // Static translation for known UI keys (fast, no API call)
  const t = useCallback(
    (key, vars) => staticTranslate(lang, key, vars),
    [lang]
  )

  // Dynamic translation via Amazon Translate Lambda (for user-generated content)
  const translate = useCallback(
    (text, sourceLang = 'en') => translateText(text, lang, sourceLang),
    [lang]
  )

  return { lang, t, translate }
}

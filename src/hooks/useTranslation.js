import { useCallback } from 'react'
import { useStore } from '../store/store'
import { t as staticTranslate } from '../i18n/translations'
import { translateText } from '../services/translate'
import { useDynamicTranslations } from '../contexts/TranslationContext'

export function useTranslation() {
  const lang = useStore(s => s.language)
  const { dynamicDict, loading } = useDynamicTranslations()

  // t() — instant: uses static dict (EN/ES) or cached dynamic translation
  const t = useCallback((key, vars = {}) => {
    let str = dynamicDict[key] || staticTranslate(lang, key, vars)
    if (Object.keys(vars).length) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v)
      })
    }
    return str
  }, [lang, dynamicDict])

  // translate() — async: calls Amazon Translate Lambda for user-generated content
  const translate = useCallback(
    (text, sourceLang = 'en') => translateText(text, lang, sourceLang),
    [lang]
  )

  return { lang, t, translate, loading }
}

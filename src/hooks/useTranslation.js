import { useStore } from '../store/store'
import { t as translate } from '../i18n/translations'

export function useTranslation() {
  const lang = useStore(s => s.language)
  return {
    lang,
    t: (key, vars) => translate(lang, key, vars),
  }
}

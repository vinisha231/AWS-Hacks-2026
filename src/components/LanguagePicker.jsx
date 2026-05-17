import { useState, useMemo } from 'react'
import { useStore } from '../store/store'
import { SUPPORTED_LANGUAGES } from '../i18n/translations'

export default function LanguagePicker() {
  const { language, setLanguage } = useStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const current = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0]

  const filtered = useMemo(() => {
    if (!query.trim()) return SUPPORTED_LANGUAGES
    const q = query.toLowerCase()
    return SUPPORTED_LANGUAGES.filter(l =>
      l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    )
  }, [query])

  function select(lang) {
    setLanguage(lang.code)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-900 border border-neutral-700 text-sm font-medium text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:block">{current.label}</span>
        <svg className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQuery('') }} />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-2xl rounded-lg z-20 animate-scale-in">
            <div className="p-2 border-b border-gray-200">
              <input
                autoFocus
                type="text"
                placeholder="Search language..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-md bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500 transition-colors"
              />
            </div>

            <div className="overflow-y-auto max-h-60">
              {filtered.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">No results</p>
              )}
              {filtered.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => select(lang)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left
                    ${lang.code === language
                      ? 'bg-white text-neutral-950 font-semibold'
                      : 'text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                  {lang.code === language && (
                    <svg className="w-4 h-4 text-neutral-950 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500 text-center">
              {SUPPORTED_LANGUAGES.length} languages via Amazon Translate
            </div>
          </div>
        </>
      )}
    </div>
  )
}

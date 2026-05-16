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
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQuery('') }} />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-20">

            {/* Search box */}
            <div className="p-2 border-b border-slate-100">
              <input
                autoFocus
                type="text"
                placeholder="Search language..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto max-h-60" style={{ height: 'auto' }}>
              {filtered.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No results</p>
              )}
              {filtered.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => select(lang)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left
                    ${lang.code === language ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}
                  `}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                  {lang.code === language && (
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 text-center">
              {SUPPORTED_LANGUAGES.length} languages via Amazon Translate
            </div>
          </div>
        </>
      )}
    </div>
  )
}

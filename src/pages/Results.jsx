import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import Layout from '../components/Layout'

const CATEGORY_LABELS = {
  food: 'Food', health: 'Health', housing: 'Housing',
  energy: 'Energy', financial: 'Financial', education: 'Education',
}

function fmt(n) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1).replace('.0', '')}k` : `$${n}`
}

function ProgramCard({ program, lang, onApply }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="bg-white border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
      style={{ borderColor: program.borderColor }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: program.bgColor }}
            >
              {program.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-lg text-slate-900">{t(program.nameKey)}</span>
                {program.waitlist && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    Waitlist may apply
                  </span>
                )}
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: program.color }}
              >
                {CATEGORY_LABELS[program.category]}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black" style={{ color: program.color }}>
              {fmt(program.estimatedAnnual)}
            </div>
            <div className="text-xs text-slate-400">{t('results_annual')}</div>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-4">{t(program.descKey)}</p>

        {/* Why you qualify */}
        <div
          className="text-xs rounded-xl px-4 py-3 mb-4 flex items-start gap-2"
          style={{ background: program.bgColor, color: program.color }}
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{t(program.whyKey)}</span>
        </div>

        {/* Documents (collapsible) */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-3"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t('results_documents')} ({program.documents.length})
        </button>

        {expanded && (
          <ul className="mb-4 space-y-1.5">
            {program.documents.map(doc => (
              <li key={doc} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-slate-400 mt-0.5">•</span>
                {doc}
              </li>
            ))}
          </ul>
        )}

        {/* Apply button */}
        <button
          onClick={() => onApply(program)}
          className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: program.color }}
        >
          {t('results_prefill')} →
        </button>
      </div>
    </div>
  )
}

export default function Results() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const { results, answers, addToTracker, setSavedPrograms } = useStore()
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!results) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-slate-600 mb-6 text-lg">{t('results_no_data')}</p>
          <Link to="/intake" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            {t('results_check_benefits')}
          </Link>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🧭</span>
          </div>
          <p className="text-slate-700 font-semibold text-xl">{t('results_loading')}</p>
          <div className="flex flex-col gap-2 text-sm text-slate-500 max-w-xs">
            {[t('results_loading_snap'), t('results_loading_medicaid'), t('results_loading_housing'), t('results_loading_values')].map((msg, i) => (
              <div key={msg} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                {msg}
              </div>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  const total = results.reduce((s, p) => s + p.estimatedAnnual, 0)
  const name = answers.name

  const handleSave = () => {
    addToTracker(results)
    setSavedPrograms(results)
    setSaved(true)
    setTimeout(() => navigate('/tracker'), 800)
  }

  const handleApply = (program) => {
    navigate(`/apply/${program.id}`)
  }

  return (
    <Layout>
      {/* Results header */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {name && <p className="text-blue-200 text-sm font-medium mb-2">{t('results_for_name', { name })}</p>}
          <h1 className="text-4xl font-black mb-3">
            {results.length > 0
              ? t('results_headline', { count: results.length })
              : t('results_no_match')}
          </h1>
          {results.length > 0 && (
            <div className="inline-flex items-center gap-3 bg-white/15 border border-white/25 rounded-2xl px-6 py-4 mt-2">
              <span className="text-4xl font-black text-emerald-300">{fmt(total)}</span>
              <span className="text-blue-200 text-left">
                <div className="font-bold">{t('results_per_year')}</div>
                <div className="text-sm opacity-80">{t('results_benefits_qualify')}</div>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {results.length > 0 && (
        <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-16 z-20 shadow-sm">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-600 text-sm">
              {t('results_count_label', { count: results.length })}
            </p>
            <div className="flex gap-3">
              <Link
                to="/intake"
                className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {t('results_restart')}
              </Link>
              <button
                onClick={handleSave}
                className={`text-sm font-bold px-4 py-2 rounded-xl transition-all
                  ${saved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {saved ? t('results_redirecting') : t('results_save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program cards */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg mb-6">{t('results_none')}</p>
            <Link to="/intake" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              {t('results_restart')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {results.map(p => (
              <ProgramCard key={p.id} program={p} lang={lang} onApply={handleApply} />
            ))}

            {/* Bottom save CTA */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
              <h3 className="font-black text-blue-900 text-lg mb-2">{t('results_dont_lose')}</h3>
              <p className="text-blue-700 text-sm mb-4">{t('results_save_desc')}</p>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                {saved ? t('results_saved') : t('results_save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

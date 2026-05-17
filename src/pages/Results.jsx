import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import Layout from '../components/Layout'
import { useRevealAll } from '../hooks/useReveal'
import { ProgramChatbot } from '../components/ProgramChatbot'

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
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="reveal bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:border-neutral-600 transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-md bg-emerald-900 border border-emerald-700 flex items-center justify-center text-xs font-black text-emerald-400 flex-shrink-0">
              {program.category[0].toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-lg text-white">{t(program.nameKey)}</span>
                {program.waitlist && (
                  <span className="text-xs font-semibold bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded-full border border-amber-700/50">
                    Waitlist may apply
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                {CATEGORY_LABELS[program.category]}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black text-white">
              {fmt(program.estimatedAnnual)}
            </div>
            <div className="text-xs text-neutral-500">{t('results_annual')}</div>
          </div>
        </div>

        <p className="text-neutral-400 text-sm leading-relaxed mb-4">{t(program.descKey)}</p>

        {/* Why you qualify */}
        <div className="text-xs rounded-md px-4 py-3 mb-4 flex items-start gap-2 bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{t(program.whyKey)}</span>
        </div>

        {/* Documents (collapsible) */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-sm text-neutral-500 hover:text-neutral-200 font-medium flex items-center gap-1 mb-3 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t('results_documents')} ({program.documents.length})
        </button>

        {expanded && (
          <ul className="mb-4 space-y-1.5 animate-fade-in">
            {program.documents.map(doc => (
              <li key={doc} className="flex items-start gap-2 text-sm text-neutral-400">
                <span className="text-emerald-600 mt-0.5 font-bold">•</span>
                {doc}
              </li>
            ))}
          </ul>
        )}

        {/* Chatbot */}
        {chatOpen && (
          <div className="mb-4">
            <ProgramChatbot programId={program.id} programName={t(program.nameKey)} />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex-1 py-3 rounded-md font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-600 transition-all"
          >
            {chatOpen ? 'Close Chat' : 'Ask Questions'}
          </button>
          <button
            onClick={() => onApply(program)}
            className="flex-1 py-3 rounded-md font-bold text-sm text-neutral-950 bg-white hover:bg-neutral-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {t('results_prefill')} →
          </button>
        </div>
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

  useRevealAll()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!results) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-neutral-400 mb-6 text-lg">{t('results_no_data')}</p>
          <Link to="/intake" className="bg-white text-neutral-950 font-bold px-6 py-3 rounded-md hover:bg-neutral-100 transition-colors">
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
            <div className="w-20 h-20 rounded-full border-4 border-neutral-800 border-t-white animate-spin" />
          </div>
          <p className="text-neutral-300 font-semibold text-xl">{t('results_loading')}</p>
          <div className="flex flex-col gap-2 text-sm text-neutral-500 max-w-xs">
            {[t('results_loading_snap'), t('results_loading_medicaid'), t('results_loading_housing'), t('results_loading_values')].map((msg, i) => (
              <div key={msg} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 0.2}s` }}>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block flex-shrink-0 mt-1.5" />
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
      <div className="border-b border-neutral-800 bg-neutral-950 py-16 px-6">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 text-center">
          {name && <p className="text-neutral-500 text-sm font-medium mb-2">{t('results_for_name', { name })}</p>}
          <h1 className="text-4xl font-black mb-3 text-white">
            {results.length > 0
              ? t('results_headline', { count: results.length })
              : t('results_no_match')}
          </h1>
          {results.length > 0 && (
            <div className="inline-flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-6 py-4 mt-2">
              <span className="text-4xl font-black text-white">{fmt(total)}</span>
              <span className="text-neutral-400 text-left">
                <div className="font-bold">{t('results_per_year')}</div>
                <div className="text-sm opacity-80">{t('results_benefits_qualify')}</div>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {results.length > 0 && (
        <div className="bg-neutral-950 border-b border-neutral-800 py-4 px-4 sticky top-16 z-20">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-neutral-400 text-sm">
              {t('results_count_label', { count: results.length })}
            </p>
            <div className="flex gap-3">
              <Link
                to="/intake"
                className="text-neutral-500 hover:text-neutral-200 text-sm font-medium px-4 py-2 rounded-md border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                {t('results_restart')}
              </Link>
              <button
                onClick={handleSave}
                className={`text-sm font-bold px-4 py-2 rounded-md transition-all
                  ${saved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
              >
                {saved ? t('results_redirecting') : t('results_save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program cards */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-10">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 text-lg mb-6">{t('results_none')}</p>
            <Link to="/intake" className="bg-white text-neutral-950 font-bold px-6 py-3 rounded-md hover:bg-neutral-100 transition-colors">
              {t('results_restart')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {results.map(p => (
              <ProgramCard key={p.id} program={p} lang={lang} onApply={handleApply} />
            ))}

            {/* Bottom save CTA */}
            <div className="reveal bg-neutral-950 text-white rounded-lg p-8 text-center">
              <h3 className="font-black text-white text-lg mb-2">{t('results_dont_lose')}</h3>
              <p className="text-neutral-400 text-sm mb-4">{t('results_save_desc')}</p>
              <button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-md transition-colors"
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
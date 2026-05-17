import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import Layout from '../components/Layout'
import { useRevealAll } from '../hooks/useReveal'
import { ProgramChatbot } from '../components/ProgramChatbot'
import { AdvocatePanel } from '../components/AdvocatePanel'
import { saveSession } from '../services/sessionApi'

const CATEGORY_LABELS = {
  food: 'Food', health: 'Health', housing: 'Housing',
  energy: 'Energy', financial: 'Financial', education: 'Education',
}

function fmt(n) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1).replace('.0', '')}k` : `$${n}`
}

function fmtRange(min, max) {
  return `${fmt(min)}–${fmt(max)}`
}

function confidenceLabel(score) {
  if (score >= 4) return 'High'
  if (score >= 3) return 'Medium'
  return 'Low'
}

function confidenceTone(score) {
  if (score >= 4) return 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
  if (score >= 3) return 'bg-amber-950/40 border-amber-800 text-amber-200'
  return 'bg-red-950/40 border-red-800 text-red-200'
}

function documentContext(program, answers) {
  const notes = []
  const household = answers?.householdMembers || []
  const hasDisability = household.includes('disabled')
  const hasAgeBased = household.some(x => ['senior','infant','toddler','school_child','teen','pregnant'].includes(x))
  const proofNeedsIncome = program.documents?.some(doc => /proof of income/i.test(doc))
  const proofNeedsMedical = program.documents?.some(doc => /medical|disability/i.test(doc)) || program.id === 'ssi'
  if (hasDisability && proofNeedsMedical) {
    notes.push('Because disability is a qualifying factor, include medical records and disability verification.')
  }
  if (hasAgeBased && program.documents?.some(doc => /birth certificate|immunization|pregnancy|child/i.test(doc))) {
    notes.push('Age-based eligibility means birth certificates, immunization records, or pregnancy verification are important.')
  }
  if (proofNeedsIncome) {
    notes.push('Income-based eligibility means pay stubs, bank statements, or benefit award letters are essential.')
  }
  return notes[0] || null
}

function ProgramCard({ program, lang, onApply, answers }) {
  const { t } = useTranslation()
  const [chatOpen, setChatOpen] = useState(false)
  const [advocateOpen, setAdvocateOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

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
                {(() => {
                  const est = Number(program.estimatedAnnual) || 0
                  const min = Math.max(0, Math.round(est * 0.6 / 100) * 100)
                  const max = Math.round(est * 1.4 / 100) * 100
                  return fmtRange(min, max)
                })()}
              </div>
              <div className="text-xs text-neutral-500">{t('results_annual')} · estimated range</div>
          </div>
        </div>

        <p className="text-neutral-400 text-sm leading-relaxed mb-4">{t(program.descKey)}</p>

        {/* Time to benefit / difficulty badges */}
        <div className="flex items-center gap-2 mb-4">
          {program.timeToBenefit && (
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full">⏱ {program.timeToBenefit}</span>
          )}
          {program.difficulty && (
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full">⚙️ {program.difficulty}</span>
          )}
        </div>

        {/* Confidence qualifier + caveats */}
        {(() => {
          const confidence = program.scores?.eligibility ?? 0
          const label = confidence >= 4 ? 'Likely eligible' : confidence >= 3 ? 'Possible eligibility' : 'Eligibility uncertain'
          const note = confidenceLabel(confidence)
          return (
            <div className={`text-xs rounded-md px-4 py-3 mb-4 flex flex-col gap-2 border ${confidence >= 4 ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : confidence >= 3 ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-red-950/40 border-red-800 text-red-200'}`}>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: confidence >= 4 ? '#34d399' : confidence >= 3 ? '#fbbf24' : '#f87171' }}>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{label} — {t(program.whyKey)}</span>
              </div>
              <div className="text-neutral-200 opacity-90 text-xs">
                Confidence: <span className="font-semibold">{note}</span>. What could disqualify you: <span className="font-semibold text-amber-100">{(program.cons && program.cons.length > 0) ? program.cons.join('; ') : 'Income too high, non-citizen status, missing documentation'}</span>
              </div>
            </div>
          )
        })()}

        {/* Pros & Cons */}
        {/* Pros & Cons — always show; fall back to generic if Bedrock didn't return them */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-md px-3 py-2.5 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#15803d' }}>Pros</p>
            <ul className="space-y-1">
              {(program.pros?.length ? program.pros : ['Can provide meaningful financial relief', 'Reduces household financial stress']).map((pro, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: '#166534' }}>
                  <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: '#16a34a' }}>+</span>{pro}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md px-3 py-2.5 border" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#b45309' }}>Cons</p>
            <ul className="space-y-1">
              {(program.cons?.length ? program.cons : ['Requires periodic renewal', 'Application process can take time']).map((con, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: '#92400e' }}>
                  <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: '#d97706' }}>−</span>{con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Documents + Steps (collapsible) */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-sm text-neutral-500 hover:text-neutral-200 font-medium flex items-center gap-1 mb-3 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          How to Apply — Step by Step
        </button>

        {expanded && (
          <div className="mb-4 animate-fade-in space-y-4">
            {program.steps?.length > 0 && (
              <ol className="space-y-2">
                {program.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step.replace(/^Step \d+:\s*/i, '')}</span>
                  </li>
                ))}
              </ol>
            )}
            {program.documents?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">{t('results_documents')} needed ({program.documents.length})</p>
                {documentContext(program, answers) && (
                  <p className="text-xs text-neutral-400 mb-3">{documentContext(program, answers)}</p>
                )}
                <ul className="space-y-1.5">
                  {program.documents.map(doc => (
                    <li key={doc} className="flex items-start gap-2 text-sm text-neutral-400">
                      <span className="text-emerald-600 mt-0.5 font-bold">•</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Chatbot */}
        {chatOpen && (
          <div className="mb-4">
            <ProgramChatbot programId={program.id} programName={t(program.nameKey)} />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex-1 py-3 rounded-md font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-600 transition-all min-w-[120px]"
          >
            {chatOpen ? 'Close Chat' : 'Ask Questions'}
          </button>
          <button
            onClick={() => setAdvocateOpen(true)}
            className="flex-1 py-3 rounded-md font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white transition-all hover:-translate-y-0.5 min-w-[120px]"
          >
            🤝 AI Advocate
          </button>
          <button
            onClick={() => onApply(program)}
            className="flex-1 py-3 rounded-md font-bold text-sm text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all hover:-translate-y-0.5 min-w-[120px]"
          >
            {t('results_prefill')} →
          </button>
        </div>
      </div>
      {advocateOpen && <AdvocatePanel program={program} onClose={() => setAdvocateOpen(false)} />}
    </div>
  )
}

function UrgentResourceCard({ resource }) {
  const typeColors = {
    crisis:  'bg-red-50 border-red-200 text-red-800',
    food:    'bg-orange-50 border-orange-200 text-orange-800',
    shelter: 'bg-amber-50 border-amber-200 text-amber-800',
    health:  'bg-blue-50 border-blue-200 text-blue-800',
  }
  const cls = typeColors[resource.type] || typeColors.crisis
  return (
    <div className={`rounded-lg border px-4 py-3 ${cls}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-sm">{resource.name}</p>
          <p className="text-xs mt-0.5 opacity-80">{resource.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {resource.phone && (
            <a href={`tel:${resource.phone}`} className="block text-sm font-black hover:underline">{resource.phone}</a>
          )}
          {resource.website && (
            <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-70 hover:opacity-100">website →</a>
          )}
        </div>
      </div>
    </div>
  )
}

function NonprofitCard({ org }) {
  const typeIcon = { food: '🥫', housing: '🏠', health: '🩺', financial: '💵', education: '📚', crisis: '🆘' }
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3 hover:border-emerald-300 transition-colors">
      <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon[org.type] || '🤝'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900">{org.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{org.description}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {org.phone && <a href={`tel:${org.phone}`} className="block text-xs font-semibold text-emerald-700 hover:underline">{org.phone}</a>}
        {org.website && <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-emerald-600">website →</a>}
      </div>
    </div>
  )
}

export default function Results() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const { results, answers, eligibilityMeta, addToTracker, setSavedPrograms } = useStore()

  const isUrgent        = eligibilityMeta?.isUrgent        ?? false
  const snapFallback    = eligibilityMeta?.snapFallback    ?? false
  const urgentResources = eligibilityMeta?.urgentResources ?? []
  const nonprofits      = eligibilityMeta?.nonprofits      ?? []
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
    // Persist to Aurora via RDS Data API (fire-and-forget — doesn't block navigation)
    saveSession({ answers, programs: results, meta: eligibilityMeta || {} })
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

      {/* Urgent needs banner */}
      {isUrgent && urgentResources.length > 0 && (
        <div className="bg-red-600 text-white px-6 py-4">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
            <p className="font-black text-lg mb-1">🚨 Immediate Help Available Now</p>
            <p className="text-sm text-red-100 mb-4">These resources require no application and can help today or this week.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {urgentResources.map((r, i) => <UrgentResourceCard key={i} resource={r} />)}
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
            {/* SNAP fallback notice */}
            {snapFallback && !results.some(p => p.category === 'food') && (
              <div className="reveal bg-orange-50 border border-orange-200 rounded-lg px-5 py-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🥫</span>
                <div>
                  <p className="font-bold text-orange-800 text-sm">Your income may be slightly above SNAP limits</p>
                  <p className="text-orange-700 text-xs mt-1">You might still get food assistance through local food banks — no income verification required. Check the nonprofits section below or call 211.</p>
                </div>
              </div>
            )}

            {results.map(p => (
              <ProgramCard key={p.id} program={p} lang={lang} onApply={handleApply} answers={answers} />
            ))}

            {/* Local nonprofits */}
            {nonprofits.length > 0 && (
              <div className="reveal">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Local Nonprofits & Community Resources</h3>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <p className="text-sm text-gray-500 mb-4 text-center">These organizations provide direct support — often with no application required.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nonprofits.map((org, i) => <NonprofitCard key={i} org={org} />)}
                </div>
              </div>
            )}

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
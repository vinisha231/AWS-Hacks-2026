import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { PROGRAMS } from '../data/programs'
import Layout from '../components/Layout'
import { useRevealAll } from '../hooks/useReveal'

const WarningIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

export default function Apply() {
  const { programId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { answers, setTrackerStatus, results } = useStore()

  useRevealAll()

  const staticProgram = PROGRAMS.find(p => p.id === programId)
  const resultProgram = results?.find(p => p.id === programId)
  const program = staticProgram || (resultProgram ? {
    id: resultProgram.id,
    category: resultProgram.category || 'financial',
    nameKey: resultProgram.nameKey || resultProgram.name || resultProgram.id,
    fullKey: resultProgram.fullKey || resultProgram.fullName || resultProgram.name || '',
    documents: resultProgram.documents || [],
    applicationUrl: resultProgram.applicationUrl || 'https://benefits.gov',
    waitlist: resultProgram.waitlist ?? false,
    renewalMonths: resultProgram.renewalMonths ?? 12,
  } : null)

  const [marked, setMarked] = useState(false)
  const [docChecked, setDocChecked] = useState({})

  if (!program) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-neutral-400 mb-4">{t('apply_not_found')}</p>
          <button onClick={() => navigate('/results')} className="text-neutral-400 font-medium hover:text-white hover:underline transition-colors">
            {t('apply_back')}
          </button>
        </div>
      </Layout>
    )
  }

  const handleMarkProgress = () => {
    setTrackerStatus(program.id, 'in_progress')
    setMarked(true)
  }

  const handleOpenApp = () => {
    setTrackerStatus(program.id, 'in_progress')
    const url = program.applicationUrl || 'https://www.benefits.gov'
    window.open(url, '_blank', 'noopener')
  }

  const toggleDoc = (doc) => setDocChecked(d => ({ ...d, [doc]: !d[doc] }))
  const allDocsChecked = program.documents.every(d => docChecked[d])
  const checkedCount = program.documents.filter(d => docChecked[d]).length

  // Pre-fill fields from answers
  const prefilled = buildPrefilled(answers, program.id, t)

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate('/results')}
            className="text-neutral-500 hover:text-neutral-200 font-medium text-sm mb-8 flex items-center gap-1 transition-colors"
          >
            {t('apply_back')}
          </button>

          {/* Header */}
          <div className="reveal flex items-center gap-4 mb-8">
            <span className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-200 flex-shrink-0">
              {program.category[0].toUpperCase()}
            </span>
            <div>
              <h1 className="text-3xl font-black text-white">{t('apply_headline', { program: t(program.nameKey) })}</h1>
              <p className="text-neutral-400">{t(program.fullKey)}</p>
            </div>
          </div>

          {/* Pre-filled form */}
          {prefilled.length > 0 && (
            <div className="reveal bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-md">
                  {t('apply_autofill_badge')}
                </div>
                <span className="text-neutral-500 text-sm">{t('apply_prefilled')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prefilled.map(({ label, value }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1">{label}</label>
                    <div className="border border-neutral-700 bg-neutral-800 rounded-md px-4 py-3 text-neutral-200 font-medium text-sm flex items-center justify-between gap-2">
                      <span>{value}</span>
                      <svg className="w-4 h-4 text-neutral-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-4">
                {t('apply_clipboard_hint')}
              </p>
            </div>
          )}

          {/* Document checklist */}
          <div className="reveal bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">{t('apply_docs_title')}</h2>
              <span className="text-sm text-neutral-500 font-medium">{checkedCount}/{program.documents.length}</span>
            </div>
            <p className="text-neutral-400 text-sm mb-4">{t('apply_docs_hint')}</p>
            <div className="flex flex-col gap-2">
              {program.documents.map(doc => (
                <button
                  key={doc}
                  onClick={() => toggleDoc(doc)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all
                    ${docChecked[doc]
                      ? 'border-white bg-white text-neutral-950'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
                    }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                    ${docChecked[doc] ? 'border-neutral-950 bg-neutral-950' : 'border-neutral-600'}`}
                  >
                    {docChecked[doc] && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${docChecked[doc] ? 'line-through opacity-70' : ''}`}>{doc}</span>
                </button>
              ))}
            </div>
            {allDocsChecked && (
              <div className="mt-4 text-center text-neutral-300 font-semibold text-sm animate-fade-in flex items-center justify-center gap-1.5">
                <CheckIcon />
                {t('apply_all_docs_ready')}
              </div>
            )}
          </div>

          {/* Waitlist warning */}
          {program.waitlist && (
            <div className="reveal bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 mb-6 flex gap-3">
              <span className="text-amber-500 flex-shrink-0 mt-0.5"><WarningIcon /></span>
              <div>
                <p className="font-semibold text-amber-400 text-sm">{t('apply_waitlist_title')}</p>
                <p className="text-amber-300 text-sm">{t('apply_waitlist_desc')}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="reveal flex flex-col gap-3">
            <button
              onClick={handleOpenApp}
              className="w-full py-4 rounded-md font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t('apply_open')}
            </button>
            <button
              onClick={handleMarkProgress}
              className={`w-full py-3.5 rounded-md font-semibold text-sm border-2 transition-all
                ${marked
                  ? 'border-emerald-600 bg-emerald-900/30 text-emerald-400'
                  : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500'
                }`}
            >
              {marked ? t('apply_marked') : t('apply_track')}
            </button>
          </div>

          {/* Renewal info */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            {t('apply_renewal_info', { months: program.renewalMonths })}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function buildPrefilled(answers, programId, t) {
  const fields = []
  if (answers.state) fields.push({ label: t('apply_state'), value: answers.state })
  if (answers.householdSize) fields.push({ label: t('apply_household_size'), value: answers.householdSize === 1 ? t('apply_person') : t('apply_people', { n: answers.householdSize }) })
  if (answers.incomeRange) fields.push({ label: t('apply_monthly_income'), value: answers.incomeRange })
  if (answers.name) fields.push({ label: t('apply_name_label'), value: answers.name })
  if (answers.situation?.includes('pregnant')) fields.push({ label: t('apply_pregnancy'), value: t('apply_pregnancy_val') })
  if (answers.situation?.includes('veteran')) fields.push({ label: t('apply_veteran'), value: t('apply_veteran_val') })
  if (answers.situation?.includes('disability')) fields.push({ label: t('apply_disability'), value: t('apply_disability_val') })
  return fields
}

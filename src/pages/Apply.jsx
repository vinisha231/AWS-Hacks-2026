import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { PROGRAMS } from '../data/programs'
import Layout from '../components/Layout'

export default function Apply() {
  const { programId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { answers, setTrackerStatus, results } = useStore()

  const program = PROGRAMS.find(p => p.id === programId)
  const resultProgram = results?.find(p => p.id === programId)

  const [marked, setMarked] = useState(false)
  const [docChecked, setDocChecked] = useState({})

  if (!program) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-slate-600 mb-4">{t('apply_not_found')}</p>
          <button onClick={() => navigate('/results')} className="text-neutral-600 font-medium hover:underline">
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
    window.open(program.applicationUrl, '_blank', 'noopener')
  }

  const toggleDoc = (doc) => setDocChecked(d => ({ ...d, [doc]: !d[doc] }))
  const allDocsChecked = program.documents.every(d => docChecked[d])
  const checkedCount = program.documents.filter(d => docChecked[d]).length

  // Pre-fill fields from answers
  const prefilled = buildPrefilled(answers, program.id, t)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back */}
        <button
          onClick={() => navigate('/results')}
          className="text-slate-500 hover:text-slate-700 font-medium text-sm mb-8 flex items-center gap-1 transition-colors"
        >
          ← {t('apply_back')}
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <span
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: program.bgColor }}
          >
            {program.icon}
          </span>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{t('apply_headline', { program: t(program.nameKey) })}</h1>
            <p className="text-slate-500">{t(program.fullKey)}</p>
          </div>
        </div>

        {/* Pre-filled form */}
        {prefilled.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                {t('apply_autofill_badge')}
              </div>
              <span className="text-slate-500 text-sm">{t('apply_prefilled')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prefilled.map(({ label, value }) => (
                <div key={label}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{label}</label>
                  <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 text-slate-800 font-medium text-sm flex items-center justify-between gap-2">
                    <span>{value}</span>
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              {t('apply_clipboard_hint')}
            </p>
          </div>
        )}

        {/* Document checklist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">{t('apply_docs_title')}</h2>
            <span className="text-sm text-slate-500 font-medium">{checkedCount}/{program.documents.length}</span>
          </div>
          <p className="text-slate-500 text-sm mb-4">{t('apply_docs_hint')}</p>
          <div className="flex flex-col gap-2">
            {program.documents.map(doc => (
              <button
                key={doc}
                onClick={() => toggleDoc(doc)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                  ${docChecked[doc]
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                  ${docChecked[doc] ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                >
                  {docChecked[doc] && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium ${docChecked[doc] ? 'line-through text-emerald-600' : ''}`}>{doc}</span>
              </button>
            ))}
          </div>
          {allDocsChecked && (
            <div className="mt-4 text-center text-emerald-700 font-semibold text-sm animate-fade-in">
              {t('apply_all_docs_ready')}
            </div>
          )}
        </div>

        {/* Waitlist warning */}
        {program.waitlist && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">{t('apply_waitlist_title')}</p>
              <p className="text-amber-700 text-sm">{t('apply_waitlist_desc')}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleOpenApp}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: program.color }}
          >
            {t('apply_open')}
          </button>
          <button
            onClick={handleMarkProgress}
            className={`w-full py-3.5 rounded-md font-semibold text-sm border-2 transition-all
              ${marked
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
              }`}
          >
            {marked ? t('apply_marked') : t('apply_track')}
          </button>
        </div>

        {/* Renewal info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {t('apply_renewal_info', { months: program.renewalMonths })}
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

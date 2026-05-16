import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { PROGRAMS, INCOME_BRACKETS } from '../data/programs'
import LanguagePicker from '../components/LanguagePicker'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming'
]

function CompassIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6 text-blue-600">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 12l-6 4-2 6 6-4 2-6z" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function ProgressBar({ step, total }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-1.5">
      <div
        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${((step) / total) * 100}%` }}
      />
    </div>
  )
}

export default function Intake() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { answers, setAnswer, setResults, updateProfile } = useStore()
  const [step, setStep] = useState(1)
  const [localAnswers, setLocalAnswers] = useState({ ...answers })
  const TOTAL = 6

  const set = (key, val) => setLocalAnswers(a => ({ ...a, [key]: val }))

  const canProceed = () => {
    if (step === 1) return !!localAnswers.state
    if (step === 2) return !!localAnswers.householdSize
    if (step === 3) return !!localAnswers.incomeRange
    if (step === 4) return true
    if (step === 5) return true
    return true
  }

  const next = () => {
    if (step < TOTAL) setStep(s => s + 1)
    else submit()
  }

  const back = () => {
    if (step > 1) setStep(s => s - 1)
    else navigate('/')
  }

  const submit = () => {
    const a = localAnswers
    const monthlyIncome = INCOME_BRACKETS[a.incomeRange] || 2500
    const payload = {
      ...a,
      monthlyIncome,
      situation: a.situation || [],
      currentBenefits: a.currentBenefits || [],
    }
    Object.entries(payload).forEach(([k, v]) => setAnswer(k, v))
    // Persist intake answers to profile so Profile page is pre-filled
    updateProfile({
      name: payload.name,
      state: payload.state,
      householdSize: payload.householdSize,
      incomeRange: payload.incomeRange,
      situation: payload.situation,
      currentBenefits: payload.currentBenefits,
    })

    // Run eligibility check
    const eligible = PROGRAMS.filter(p => p.check(payload)).map(p => {
      const est = p.estimatedAnnual(payload.householdSize || 1, monthlyIncome, payload.situation || [])
      return { ...p, estimatedAnnual: est }
    }).sort((a, b) => b.estimatedAnnual - a.estimatedAnnual)

    setResults(eligible)
    navigate('/results')
  }

  const toggleArr = (key, val) => {
    const arr = localAnswers[key] || []
    if (key === 'currentBenefits' && val === 'none') {
      set(key, arr.includes('none') ? [] : ['none'])
      return
    }
    if (key === 'currentBenefits') {
      const without_none = arr.filter(v => v !== 'none')
      set(key, without_none.includes(val) ? without_none.filter(v => v !== val) : [...without_none, val])
      return
    }
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
            <CompassIcon />
            <span className="font-bold text-slate-900">Compass</span>
          </button>
          <div className="flex-1 max-w-48">
            <ProgressBar step={step} total={TOTAL} />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {t('intake_progress', { current: step, total: TOTAL })}
            </p>
          </div>
          <LanguagePicker />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl animate-slide-up" key={step}>
          <StepContent step={step} answers={localAnswers} set={set} toggleArr={toggleArr} t={t} />

          <div className="flex items-center justify-between mt-10">
            <button
              onClick={back}
              className="text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
            >
              {t('intake_back')}
            </button>
            <button
              onClick={next}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-2xl font-bold text-base transition-all shadow-sm
                ${canProceed()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:-translate-y-0.5'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              {step === TOTAL ? t('intake_submit') : t('intake_next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepContent({ step, answers, set, toggleArr, t }) {
  if (step === 1) return (
    <div>
      <StepLabel num={1} />
      <h2 className="text-3xl font-black text-slate-900 mb-2">{t('step1_q')}</h2>
      <p className="text-slate-500 mb-8">{t('step1_hint')}</p>
      <select
        value={answers.state || ''}
        onChange={e => set('state', e.target.value)}
        className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-5 py-4 text-slate-900 text-base bg-white outline-none transition-colors font-medium"
      >
        <option value="">{t('step1_placeholder')}</option>
        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )

  if (step === 2) return (
    <div>
      <StepLabel num={2} />
      <h2 className="text-3xl font-black text-slate-900 mb-2">{t('step2_q')}</h2>
      <p className="text-slate-500 mb-8">{t('step2_hint')}</p>
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4,5,6,7,8].map(n => (
          <button
            key={n}
            onClick={() => set('householdSize', n)}
            className={`aspect-square rounded-2xl font-black text-2xl border-2 transition-all
              ${answers.householdSize === n
                ? 'bg-blue-600 border-blue-600 text-white scale-105 shadow-lg shadow-blue-200'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
          >
            {n === 8 ? '8+' : n}
          </button>
        ))}
      </div>
    </div>
  )

  if (step === 3) return (
    <div>
      <StepLabel num={3} />
      <h2 className="text-3xl font-black text-slate-900 mb-2">{t('step3_q')}</h2>
      <p className="text-slate-500 mb-8">{t('step3_hint')}</p>
      <div className="flex flex-col gap-2">
        {['step3_opt1','step3_opt2','step3_opt3','step3_opt4','step3_opt5','step3_opt6','step3_opt7','step3_opt8'].map(key => {
          const label = t(key)
          return (
            <button
              key={key}
              onClick={() => set('incomeRange', label)}
              className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 font-medium text-base transition-all
                ${answers.incomeRange === label
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (step === 4) return (
    <div>
      <StepLabel num={4} />
      <h2 className="text-3xl font-black text-slate-900 mb-2">{t('step4_q')}</h2>
      <p className="text-slate-500 mb-8">{t('step4_hint')}</p>
      <div className="flex flex-col gap-2">
        {[
          ['pregnant', t('step4_pregnant'), '🤱'],
          ['infants',  t('step4_infants'),  '👶'],
          ['school',   t('step4_school'),   '🎒'],
          ['senior',   t('step4_senior'),   '👴'],
          ['disability',t('step4_disability'),'♿'],
          ['veteran',  t('step4_veteran'),  '🎖️'],
          ['housing',  t('step4_housing'),  '🏠'],
          ['employed', t('step4_employed'), '💼'],
        ].map(([val, label, icon]) => {
          const selected = (answers.situation || []).includes(val)
          return (
            <button
              key={val}
              onClick={() => toggleArr('situation', val)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 font-medium text-base transition-all text-left
                ${selected
                  ? 'bg-blue-50 border-blue-500 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="flex-1">{label}</span>
              {selected && (
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (step === 5) return (
    <div>
      <StepLabel num={5} />
      <h2 className="text-3xl font-black text-slate-900 mb-2">{t('step5_q')}</h2>
      <p className="text-slate-500 mb-8">{t('step5_hint')}</p>
      <div className="flex flex-col gap-2">
        {[
          ['snap',     t('step5_snap'),     '🛒'],
          ['medicaid', t('step5_medicaid'), '🏥'],
          ['housing',  t('step5_housing'),  '🏠'],
          ['ssi',      t('step5_ssi'),      '🛡️'],
          ['none',     t('step5_none'),     '—'],
        ].map(([val, label, icon]) => {
          const selected = (answers.currentBenefits || []).includes(val)
          return (
            <button
              key={val}
              onClick={() => toggleArr('currentBenefits', val)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 font-medium text-base transition-all text-left
                ${selected
                  ? 'bg-blue-50 border-blue-500 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="flex-1">{label}</span>
              {selected && (
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (step === 6) return (
    <div>
      <StepLabel num={6} />
      <h2 className="text-3xl font-black text-slate-900 mb-2">{t('step6_q')}</h2>
      <p className="text-slate-500 mb-8">{t('step6_hint')}</p>
      <input
        type="text"
        placeholder={t('step6_placeholder')}
        value={answers.name || ''}
        onChange={e => set('name', e.target.value)}
        className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-5 py-4 text-slate-900 text-base bg-white outline-none transition-colors font-medium"
      />
      <p className="text-slate-400 text-sm mt-3">
        You're almost there! Click "{t('intake_submit')}" to see your results.
      </p>
    </div>
  )
}

function StepLabel({ num }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{num}</span>
      <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Question {num}</span>
    </div>
  )
}

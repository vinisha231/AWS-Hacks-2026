import { useState } from 'react'
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

const TOTAL = 9

function CompassIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6 text-white">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 12l-6 4-2 6 6-4 2-6z" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function ProgressBar({ step, total }) {
  return (
    <div className="w-full bg-neutral-800 rounded-full h-1.5">
      <div
        className="bg-white h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function ToggleButton({ selected, onClick, icon, label, sublabel }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-md border-2 font-medium text-base transition-all text-left
        ${selected
          ? 'bg-neutral-950 border-neutral-950 text-white'
          : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
        }`}
    >
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <span className="flex-1">
        {label}
        {sublabel && <span className={`block text-xs mt-0.5 ${selected ? 'text-neutral-300' : 'text-neutral-400'}`}>{sublabel}</span>}
      </span>
      {selected && <CheckIcon />}
    </button>
  )
}

function RadioButton({ selected, onClick, icon, label, sublabel }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-md border-2 font-medium text-base transition-all text-left
        ${selected
          ? 'bg-neutral-950 border-neutral-950 text-white'
          : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
        }`}
    >
      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-white' : 'border-neutral-300'}`}>
        {selected && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
      </span>
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <span className="flex-1">
        {label}
        {sublabel && <span className={`block text-xs mt-0.5 ${selected ? 'text-neutral-300' : 'text-neutral-400'}`}>{sublabel}</span>}
      </span>
    </button>
  )
}

export default function Intake() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { answers, setAnswer, setResults, updateProfile } = useStore()
  const [step, setStep] = useState(1)
  const [localAnswers, setLocalAnswers] = useState({ ...answers })

  const set = (key, val) => setLocalAnswers(a => ({ ...a, [key]: val }))

  const canProceed = () => {
    if (step === 1) return !!localAnswers.state
    if (step === 2) return !!localAnswers.householdSize
    if (step === 3) return !!localAnswers.incomeRange
    if (step === 4) return (localAnswers.householdMembers || []).length > 0
    if (step === 5) return !!localAnswers.employment
    if (step === 6) return !!localAnswers.healthCoverage
    if (step === 7) return !!localAnswers.housingStatus
    if (step === 8) return !!localAnswers.citizenship
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
      householdMembers: a.householdMembers || [],
      currentBenefits:  a.currentBenefits  || [],
    }
    Object.entries(payload).forEach(([k, v]) => setAnswer(k, v))
    updateProfile({
      name:            payload.name,
      state:           payload.state,
      householdSize:   payload.householdSize,
      incomeRange:     payload.incomeRange,
      householdMembers: payload.householdMembers,
      employment:      payload.employment,
      healthCoverage:  payload.healthCoverage,
      housingStatus:   payload.housingStatus,
      citizenship:     payload.citizenship,
      currentBenefits: payload.currentBenefits,
    })

    const eligible = PROGRAMS.filter(p => p.check(payload)).map(p => {
      const est = p.estimatedAnnual(payload.householdSize || 1, monthlyIncome, payload)
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
      const withoutNone = arr.filter(v => v !== 'none')
      set(key, withoutNone.includes(val) ? withoutNone.filter(v => v !== val) : [...withoutNone, val])
      return
    }
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <div className="bg-neutral-950 border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
            <CompassIcon />
            <span className="font-bold text-white">Compass</span>
          </button>
          <div className="flex-1 max-w-48">
            <ProgressBar step={step} total={TOTAL} />
            <p className="text-xs text-neutral-400 mt-1 text-right">Step {step} of {TOTAL}</p>
          </div>
          <LanguagePicker />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl animate-slide-up" key={step}>
          <StepContent step={step} answers={localAnswers} set={set} toggleArr={toggleArr} t={t} />

          <div className="flex items-center justify-between mt-10">
            <button onClick={back} className="text-neutral-500 hover:text-neutral-200 font-medium text-sm transition-colors">
              {t('intake_back')}
            </button>
            <button
              onClick={next}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-md font-bold text-base transition-all shadow-sm
                ${canProceed()
                  ? 'bg-white hover:bg-neutral-100 text-neutral-950 hover:-translate-y-0.5'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
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
  // Step 1: State
  if (step === 1) return (
    <div>
      <StepLabel num={1} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">{t('step1_q')}</h2>
      <p className="text-neutral-400 mb-8">{t('step1_hint')}</p>
      <select
        value={answers.state || ''}
        onChange={e => set('state', e.target.value)}
        className="w-full border border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-5 py-4 text-white text-base bg-neutral-800 outline-none transition-colors font-medium"
      >
        <option value="">{t('step1_placeholder')}</option>
        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )

  // Step 2: Household size
  if (step === 2) return (
    <div>
      <StepLabel num={2} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">{t('step2_q')}</h2>
      <p className="text-neutral-400 mb-8">{t('step2_hint')}</p>
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4,5,6,7,8].map(n => (
          <button
            key={n}
            onClick={() => set('householdSize', n)}
            className={`aspect-square rounded-md font-black text-2xl border-2 transition-all
              ${answers.householdSize === n
                ? 'bg-white border-white text-neutral-950 scale-105'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
              }`}
          >
            {n === 8 ? '8+' : n}
          </button>
        ))}
      </div>
    </div>
  )

  // Step 3: Income
  if (step === 3) return (
    <div>
      <StepLabel num={3} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">{t('step3_q')}</h2>
      <p className="text-neutral-400 mb-8">{t('step3_hint')}</p>
      <div className="flex flex-col gap-2">
        {['step3_opt1','step3_opt2','step3_opt3','step3_opt4','step3_opt5','step3_opt6','step3_opt7','step3_opt8'].map(key => {
          const label = t(key)
          return (
            <RadioButton
              key={key}
              selected={answers.incomeRange === label}
              onClick={() => set('incomeRange', label)}
              label={label}
            />
          )
        })}
      </div>
    </div>
  )

  // Step 4: Who is in your household
  if (step === 4) return (
    <div>
      <StepLabel num={4} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">Who lives in your household?</h2>
      <p className="text-neutral-400 mb-6">Select everyone who lives with you. This determines which programs your family can access.</p>
      <div className="flex flex-col gap-2">
        {[
          ['infant',      '👶', 'Infant (under 1 year old)',          'Qualifies for WIC, Early Head Start'],
          ['toddler',     '🧒', 'Young child (1–4 years old)',        'Qualifies for WIC, Head Start, child care'],
          ['school_child','🎒', 'School-age child (5–12)',            'Qualifies for free/reduced school meals, CHIP'],
          ['teen',        '🧑', 'Teenager (13–18)',                   'Qualifies for CHIP, free school meals'],
          ['adult',       '🧑‍💼', 'Adult (19–64)',                    'Required — select if you or another adult lives here'],
          ['senior',      '👴', 'Senior (65 or older)',               'Qualifies for Medicare Savings, SSI'],
          ['pregnant',    '🤱', 'Pregnant or recently gave birth',    'Qualifies for WIC, expanded Medicaid'],
          ['disabled',    '♿', 'Someone with a disability',          'Qualifies for SSI, Medicaid, priority housing'],
          ['veteran',     '🎖️','Veteran or active military',          'Qualifies for VA healthcare and benefits'],
        ].map(([val, icon, label, sublabel]) => (
          <ToggleButton
            key={val}
            selected={(answers.householdMembers || []).includes(val)}
            onClick={() => toggleArr('householdMembers', val)}
            icon={icon}
            label={label}
            sublabel={sublabel}
          />
        ))}
      </div>
    </div>
  )

  // Step 5: Employment
  if (step === 5) return (
    <div>
      <StepLabel num={5} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">What is your current work situation?</h2>
      <p className="text-neutral-400 mb-6">This affects eligibility for SNAP, EITC, job training, and child care programs.</p>
      <div className="flex flex-col gap-2">
        {[
          ['employed',            '💼', 'Employed full-time or part-time',   'Working for an employer'],
          ['self_employed',       '🏠', 'Self-employed or freelance',         'Running your own business or gig work'],
          ['recently_unemployed', '📋', 'Recently lost a job',                'Job loss within the last 6 months'],
          ['unemployed',          '🔍', 'Unemployed, looking for work',       'Actively job searching'],
          ['not_working',         '🚫', 'Not working and not looking',        'Unable to work or not seeking employment'],
          ['student',             '🎓', 'Full-time student',                  'Enrolled in school or training program'],
        ].map(([val, icon, label, sublabel]) => (
          <RadioButton
            key={val}
            selected={answers.employment === val}
            onClick={() => set('employment', val)}
            icon={icon}
            label={label}
            sublabel={sublabel}
          />
        ))}
      </div>
    </div>
  )

  // Step 6: Health insurance
  if (step === 6) return (
    <div>
      <StepLabel num={6} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">Do you have health insurance?</h2>
      <p className="text-neutral-400 mb-6">This helps us identify if you qualify for Medicaid, ACA subsidies, or Medicare programs.</p>
      <div className="flex flex-col gap-2">
        {[
          ['employer',    '✅', 'Yes — through my employer',         'Employer-sponsored health plan'],
          ['marketplace', '📋', 'Yes — through ACA/Marketplace',    'Plan bought on healthcare.gov'],
          ['medicare',    '🏥', 'Yes — Medicare',                   'Federal Medicare program (usually age 65+)'],
          ['medicaid',    '💊', 'Yes — Medicaid or state plan',     'State-funded health coverage'],
          ['none',        '❌', 'No — I am uninsured',              'No current health coverage'],
        ].map(([val, icon, label, sublabel]) => (
          <RadioButton
            key={val}
            selected={answers.healthCoverage === val}
            onClick={() => set('healthCoverage', val)}
            icon={icon}
            label={label}
            sublabel={sublabel}
          />
        ))}
      </div>
    </div>
  )

  // Step 7: Housing status
  if (step === 7) return (
    <div>
      <StepLabel num={7} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">What is your current housing situation?</h2>
      <p className="text-neutral-400 mb-6">This affects eligibility for housing vouchers, emergency rental assistance, and utility programs.</p>
      <div className="flex flex-col gap-2">
        {[
          ['renting',   '🏠', 'Renting an apartment or house',      'Month-to-month or lease'],
          ['owning',    '🔑', 'Own my home',                        'Mortgage or paid off'],
          ['homeless',  '🏕️', 'Experiencing homelessness',          'No stable housing — highest priority for vouchers'],
          ['shared',    '🤝', 'Living with family or friends',       'Temporarily staying with others'],
          ['subsidized','📋', 'Already in subsidized/public housing','In a HUD program currently'],
        ].map(([val, icon, label, sublabel]) => (
          <RadioButton
            key={val}
            selected={answers.housingStatus === val}
            onClick={() => set('housingStatus', val)}
            icon={icon}
            label={label}
            sublabel={sublabel}
          />
        ))}
      </div>
    </div>
  )

  // Step 8: Citizenship
  if (step === 8) return (
    <div>
      <StepLabel num={8} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">What is your citizenship or immigration status?</h2>
      <p className="text-neutral-400 mb-6">Many federal programs require US citizenship or legal residency. Your answer is private and never stored with your name.</p>
      <div className="flex flex-col gap-2">
        {[
          ['citizens',     '🇺🇸', 'All US citizens',                        'Everyone in household is a US citizen'],
          ['lpr',          '🌿', 'Legal permanent resident(s)',              'Green card holder(s)'],
          ['mixed',        '🏠', 'Mixed household',                         'Some citizens, some non-citizens'],
          ['other',        '📄', 'Other immigration status',                'DACA, refugee, visa, or other'],
          ['prefer_not',   '🤐', 'Prefer not to answer',                   'You can still see available programs'],
        ].map(([val, icon, label, sublabel]) => (
          <RadioButton
            key={val}
            selected={answers.citizenship === val}
            onClick={() => set('citizenship', val)}
            icon={icon}
            label={label}
            sublabel={sublabel}
          />
        ))}
      </div>
    </div>
  )

  // Step 9: Current benefits + name
  if (step === 9) return (
    <div>
      <StepLabel num={9} total={TOTAL} />
      <h2 className="text-3xl font-black text-white mb-2">Are you already receiving any of these?</h2>
      <p className="text-neutral-400 mb-6">We'll skip programs you already have so your results only show new opportunities.</p>
      <div className="flex flex-col gap-2 mb-8">
        {[
          ['snap',     '🛒', 'SNAP (food stamps)'],
          ['medicaid', '🏥', 'Medicaid / state health insurance'],
          ['housing',  '🏠', 'Section 8 / housing voucher'],
          ['ssi',      '🛡️', 'SSI (Supplemental Security Income)'],
          ['none',     '—',  'None of the above'],
        ].map(([val, icon, label]) => (
          <ToggleButton
            key={val}
            selected={(answers.currentBenefits || []).includes(val)}
            onClick={() => toggleArr('currentBenefits', val)}
            icon={icon}
            label={label}
          />
        ))}
      </div>
      <div className="border-t border-neutral-700 pt-6">
        <label className="text-sm font-semibold text-neutral-400 block mb-2">Your first name (optional)</label>
        <input
          type="text"
          placeholder="e.g. Maria"
          value={answers.name || ''}
          onChange={e => set('name', e.target.value)}
          className="w-full border border-neutral-700 focus:border-white focus:ring-1 focus:ring-white rounded-md px-5 py-4 text-white text-base bg-neutral-800 outline-none transition-colors font-medium"
        />
        <p className="text-neutral-500 text-sm mt-2">Used to personalize your results. Never shared.</p>
      </div>
    </div>
  )
}

function StepLabel({ num, total }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-7 h-7 rounded-full bg-white text-neutral-950 text-xs font-bold flex items-center justify-center">{num}</span>
      <span className="text-xs text-neutral-500 font-semibold uppercase tracking-widest">Question {num} of {total}</span>
    </div>
  )
}

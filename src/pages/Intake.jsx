import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { PROGRAMS, INCOME_BRACKETS } from '../data/programs'
import { prioritize } from '../services/prioritization'
import { fetchBedrockEligibility } from '../services/bedrockEligibility'
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

function RtaLogo() {
  return (
    <span
      className="flex items-center justify-center w-8 h-8 rounded-lg text-white font-black text-base leading-none select-none flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#fbbf24,#fb923c,#fb7185)', fontFamily: 'system-ui,sans-serif' }}
    >ऋ</span>
  )
}

function ProgressBar({ step, total }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
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
      style={selected ? { backgroundColor: '#059669', borderColor: '#059669', color: '#ffffff' } : {}}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-md border-2 font-medium text-base transition-all text-left
        ${selected
          ? 'border-emerald-600'
          : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
        }`}
    >
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <span className="flex-1">
        {label}
        {sublabel && <span className={`block text-xs mt-0.5 ${selected ? 'opacity-80' : 'text-gray-400'}`}>{sublabel}</span>}
      </span>
      {selected && (
        <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#ffffff' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  )
}

function RadioButton({ selected, onClick, icon, label, sublabel }) {
  return (
    <button
      onClick={onClick}
      style={selected ? { backgroundColor: '#059669', borderColor: '#059669', color: '#ffffff' } : {}}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-md border-2 font-medium text-base transition-all text-left
        ${selected
          ? 'border-emerald-600'
          : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
        }`}
    >
      <span
        style={selected ? { borderColor: '#ffffff', backgroundColor: '#047857' } : {}}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? '' : 'border-gray-400'}`}
      >
        {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ffffff' }} />}
      </span>
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <span className="flex-1">
        {label}
        {sublabel && <span className={`block text-xs mt-0.5 ${selected ? 'opacity-80' : 'text-gray-400'}`}>{sublabel}</span>}
      </span>
    </button>
  )
}

export default function Intake() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { answers, setAnswer, setResults, setEligibilityMeta, updateProfile } = useStore()
  const [step, setStep] = useState(1)
  const [localAnswers, setLocalAnswers] = useState({ ...answers })
  const [submitting, setSubmitting] = useState(false)

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

  const submit = async () => {
    setSubmitting(true)
    const a = localAnswers
    const monthlyIncome = INCOME_BRACKETS[a.incomeRange] ?? null
    const payload = {
      ...a,
      monthlyIncome,
      householdMembers: a.householdMembers || [],
      currentBenefits:  a.currentBenefits  || [],
    }
    Object.entries(payload).forEach(([k, v]) => setAnswer(k, v))
    updateProfile({
      name:             payload.name,
      state:            payload.state,
      householdSize:    payload.householdSize,
      incomeRange:      payload.incomeRange,
      householdMembers: payload.householdMembers,
      employment:       payload.employment,
      healthCoverage:   payload.healthCoverage,
      housingStatus:    payload.housingStatus,
      citizenship:      payload.citizenship,
      currentBenefits:  payload.currentBenefits,
    })

    let programs
    try {
      const data = await fetchBedrockEligibility(payload)
      programs = data.programs
      const apiMeta = {
        isUrgent:        data.isUrgent,
        snapFallback:    data.snapFallback,
        urgentResources: data.urgentResources,
        nonprofits:      data.nonprofits,
      }
      // prioritize using Bedrock-provided metadata
      const prioritized = prioritize(programs, payload, apiMeta)
      setEligibilityMeta({ ...apiMeta, fallback: prioritized.fallback, highRisk: prioritized.highRisk })
      programs = prioritized.programs
    } catch (err) {
      console.warn('Bedrock API unavailable, using static programs:', err)
      programs = PROGRAMS.filter(p => p.check(payload)).map(p => {
        const est = p.estimatedAnnual(payload.householdSize || 1, monthlyIncome, payload)
        return { ...p, estimatedAnnual: est }
      }).sort((a, b) => b.estimatedAnnual - a.estimatedAnnual)
      // prioritize static results
      const prioritized = prioritize(programs, payload, {})
      setEligibilityMeta({ isUrgent: false, snapFallback: false, nonprofits: [], fallback: prioritized.fallback, highRisk: prioritized.highRisk })
      programs = prioritized.programs
    }

    setResults(programs)
    setSubmitting(false)
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
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <RtaLogo />
            <span className="font-black text-gray-900">Rta</span>
          </button>
          <div className="flex-1 max-w-48">
            <ProgressBar step={step} total={TOTAL} />
            <p className="text-xs text-gray-400 mt-1 text-right">Step {step} of {TOTAL}</p>
          </div>
          <LanguagePicker />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl animate-slide-up" key={step}>
          <StepContent step={step} answers={localAnswers} set={set} toggleArr={toggleArr} t={t} />

          <div className="flex items-center justify-between mt-10">
            <button onClick={back} className="text-gray-400 hover:text-gray-700 font-medium text-sm transition-colors">
              {t('intake_back')}
            </button>
            <button
              onClick={next}
              disabled={!canProceed() || submitting}
              style={canProceed() && !submitting ? { backgroundColor: '#059669', color: '#ffffff' } : {}}
              className={`px-8 py-3 rounded-md font-bold text-base transition-all shadow-sm flex items-center gap-2
                ${canProceed() && !submitting
                  ? 'hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Checking eligibility...' : step === TOTAL ? t('intake_submit') : t('intake_next')}
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
      <StepLabel num={1} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step1_q')}</h2>
      <p className="text-gray-500 mb-8">{t('step1_hint')}</p>
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
      <StepLabel num={2} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step2_q')}</h2>
      <p className="text-gray-500 mb-8">{t('step2_hint')}</p>
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4,5,6,7,8].map(n => (
          <button
            key={n}
            onClick={() => set('householdSize', n)}
            className={`aspect-square rounded-md font-black text-2xl border-2 transition-all
              ${answers.householdSize === n
                ? 'bg-emerald-600 border-emerald-600 text-white scale-105'
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
      <StepLabel num={3} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step3_q')}</h2>
      <p className="text-gray-500 mb-8">{t('step3_hint')}</p>
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
      <StepLabel num={4} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step4_new_q')}</h2>
      <p className="text-gray-500 mb-6">{t('step4_new_hint')}</p>
      <div className="flex flex-col gap-2">
        {[
          ['infant',      '👶', t('hh_infant'),       t('hh_infant_sub')],
          ['toddler',     '🧒', t('hh_toddler'),      t('hh_toddler_sub')],
          ['school_child','🎒', t('hh_school_child'), t('hh_school_child_sub')],
          ['teen',        '🧑', t('hh_teen'),         t('hh_teen_sub')],
          ['adult',       '🧑‍💼', t('hh_adult'),      t('hh_adult_sub')],
          ['senior',      '👴', t('hh_senior'),       t('hh_senior_sub')],
          ['pregnant',    '🤱', t('hh_pregnant'),     t('hh_pregnant_sub')],
          ['disabled',    '♿', t('hh_disabled'),     t('hh_disabled_sub')],
          ['veteran',     '🎖️', t('hh_veteran'),     t('hh_veteran_sub')],
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
      <StepLabel num={5} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step5_new_q')}</h2>
      <p className="text-gray-500 mb-6">{t('step5_new_hint')}</p>
      <div className="flex flex-col gap-2">
        {[
          ['employed',            '💼', t('emp_employed'),    t('emp_employed_sub')],
          ['self_employed',       '🏠', t('emp_self'),        t('emp_self_sub')],
          ['recently_unemployed', '📋', t('emp_recent'),      t('emp_recent_sub')],
          ['unemployed',          '🔍', t('emp_unemployed'),  t('emp_unemployed_sub')],
          ['not_working',         '🚫', t('emp_not_working'), t('emp_not_working_sub')],
          ['student',             '🎓', t('emp_student'),     t('emp_student_sub')],
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
      <StepLabel num={6} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step6_new_q')}</h2>
      <p className="text-gray-500 mb-6">{t('step6_new_hint')}</p>
      <div className="flex flex-col gap-2">
        {[
          ['employer',    '✅', t('health_employer'),     t('health_employer_sub')],
          ['marketplace', '📋', t('health_marketplace'),  t('health_marketplace_sub')],
          ['medicare',    '🏥', t('health_medicare'),     t('health_medicare_sub')],
          ['medicaid',    '💊', t('health_medicaid_cov'), t('health_medicaid_sub')],
          ['none',        '❌', t('health_none'),         t('health_none_sub')],
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
      <StepLabel num={7} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step7_new_q')}</h2>
      <p className="text-gray-500 mb-6">{t('step7_new_hint')}</p>
      <div className="flex flex-col gap-2">
        {[
          ['renting',   '🏠', t('housing_renting'),    t('housing_renting_sub')],
          ['owning',    '🔑', t('housing_owning'),     t('housing_owning_sub')],
          ['homeless',  '🏕️', t('housing_homeless'),  t('housing_homeless_sub')],
          ['shared',    '🤝', t('housing_shared'),     t('housing_shared_sub')],
          ['subsidized','📋', t('housing_subsidized'), t('housing_subsidized_sub')],
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
      <StepLabel num={8} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step8_new_q')}</h2>
      <p className="text-gray-500 mb-6">{t('step8_new_hint')}</p>
      <div className="flex flex-col gap-2">
        {[
          ['citizens',   '🇺🇸', t('cit_citizens'),   t('cit_citizens_sub')],
          ['lpr',        '🌿',  t('cit_lpr'),         t('cit_lpr_sub')],
          ['mixed',      '🏠',  t('cit_mixed'),       t('cit_mixed_sub')],
          ['other',      '📄',  t('cit_other'),       t('cit_other_sub')],
          ['prefer_not', '🤐',  t('cit_prefer_not'),  t('cit_prefer_not_sub')],
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
      <StepLabel num={9} total={TOTAL} t={t} />
      <h2 className="text-3xl font-black text-gray-900 mb-2">{t('step9_new_q')}</h2>
      <p className="text-gray-500 mb-6">{t('step9_new_hint')}</p>
      <div className="flex flex-col gap-2 mb-8">
        {[
          ['snap',     '🛒', t('ben_snap')],
          ['medicaid', '🏥', t('ben_medicaid')],
          ['housing',  '🏠', t('ben_housing')],
          ['ssi',      '🛡️', t('ben_ssi')],
          ['none',     '—',  t('ben_none')],
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
        <label className="text-sm font-semibold text-neutral-400 block mb-2">{t('intake_name_label')}</label>
        <input
          type="text"
          placeholder={t('intake_name_placeholder')}
          value={answers.name || ''}
          onChange={e => set('name', e.target.value)}
          className="w-full border border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-md px-5 py-4 text-white text-base bg-neutral-800 outline-none transition-colors font-medium"
        />
        <p className="text-neutral-500 text-sm mt-2">{t('intake_name_hint')}</p>
      </div>
    </div>
  )
}

function StepLabel({ num, total, t }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">{num}</span>
      <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">{t('step_label_of', { num, total })}</span>
    </div>
  )
}

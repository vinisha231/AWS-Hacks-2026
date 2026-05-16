import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { PROGRAMS, INCOME_BRACKETS } from '../data/programs'
import Layout from '../components/Layout'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const INCOME_OPTIONS = Object.keys(INCOME_BRACKETS)

const SITUATION_OPTIONS = [
  { value: 'pregnant',   label: 'Pregnant or recently gave birth' },
  { value: 'infants',    label: 'Children under age 5' },
  { value: 'school',     label: 'School-age children (5–18)' },
  { value: 'senior',     label: 'Someone 60 or older' },
  { value: 'disability', label: 'Someone with a disability' },
  { value: 'veteran',    label: 'Veteran or active military' },
  { value: 'housing',    label: 'Experiencing housing instability' },
  { value: 'employed',   label: 'At least one person is employed' },
]

const CURRENT_BENEFITS_OPTIONS = [
  { value: 'snap',     label: 'SNAP / Food Stamps' },
  { value: 'medicaid', label: 'Medicaid or CHIP' },
  { value: 'housing',  label: 'Housing vouchers (Section 8)' },
  { value: 'ssi',      label: 'SSI or SSDI' },
]

const EMPLOYMENT_OPTIONS = [
  { value: 'employed_full',  label: 'Employed full-time' },
  { value: 'employed_part',  label: 'Employed part-time' },
  { value: 'self_employed',  label: 'Self-employed' },
  { value: 'unemployed',     label: 'Unemployed / looking for work' },
  { value: 'retired',        label: 'Retired' },
  { value: 'unable_to_work', label: 'Unable to work (disability)' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { profile, setProfile, clearProfile, answers, setResults, addToTracker, setSavedPrograms } = useStore()

  // Merge profile over answers so profile edits win; fall back to intake answers
  const merged = { ...answers, ...profile }

  const [form, setForm] = useState({
    name:             merged.name             || '',
    email:            merged.email            || '',
    phone:            merged.phone            || '',
    state:            merged.state            || '',
    householdSize:    merged.householdSize    || '',
    incomeRange:      merged.incomeRange      || '',
    situation:        merged.situation        || [],
    currentBenefits:  merged.currentBenefits  || [],
    employmentStatus: merged.employmentStatus || '',
  })

  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const toggleList = (key, value) => {
    setForm(f => {
      const arr = f[key] || []
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      return { ...f, [key]: next }
    })
    setDirty(true)
    setSaved(false)
  }

  const save = () => {
    setProfile(form)
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const checkEligibility = () => {
    // Save first, then re-run
    setProfile(form)
    const monthlyIncome = INCOME_BRACKETS[form.incomeRange] || 2500
    const payload = {
      ...form,
      monthlyIncome,
      situation: form.situation || [],
      currentBenefits: form.currentBenefits || [],
    }
    const eligible = PROGRAMS
      .filter(p => p.check(payload))
      .map(p => {
        const est = p.estimatedAnnual(
          payload.householdSize || 1,
          monthlyIncome,
          payload.situation || []
        )
        return { ...p, estimatedAnnual: est }
      })
      .sort((a, b) => b.estimatedAnnual - a.estimatedAnnual)

    setResults(eligible)
    if (eligible.length > 0) {
      addToTracker(eligible)
      setSavedPrograms(eligible)
    }
    navigate('/results')
  }

  const resetProfile = () => {
    clearProfile()
    setForm({
      name: '', email: '', phone: '', state: '', householdSize: '',
      incomeRange: '', situation: [], currentBenefits: [], employmentStatus: '',
    })
    setSaved(false)
    setDirty(false)
    setConfirmReset(false)
  }

  const hasData = !!(form.state || form.householdSize || form.incomeRange)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">My Profile</h1>
            <p className="text-slate-500 text-sm">
              Your information is saved locally and used to personalize your benefit results. Edit anytime.
            </p>
          </div>
          <div className="flex-shrink-0">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-sm text-slate-400 hover:text-red-500 font-medium transition-colors"
              >
                Reset profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Clear all data?</span>
                <button
                  onClick={resetProfile}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary card — only shown when data exists */}
        {hasData && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {form.name && (
                <p className="font-semibold text-slate-900">{form.name}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {form.state && <span>{form.state}</span>}
                {form.householdSize && <span>{form.householdSize} {form.householdSize === 1 ? 'person' : 'people'}</span>}
                {form.incomeRange && <span>{form.incomeRange}/mo</span>}
              </div>
            </div>
            <button
              onClick={checkEligibility}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Re-check eligibility
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6">

          {/* Personal */}
          <Section title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name">
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Optional"
                  className={inputCls}
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="Optional"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Phone number">
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="Optional — for SMS renewal reminders"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* Household */}
          <Section title="Household">
            <Field label="State" required>
              <select
                value={form.state}
                onChange={e => update('state', e.target.value)}
                className={inputCls}
              >
                <option value="">Select your state...</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Household size (including you)" required>
              <div className="grid grid-cols-8 gap-2">
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update('householdSize', n)}
                    className={`py-2 rounded-lg border-2 font-bold text-sm transition-all
                      ${form.householdSize === n
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {n === 8 ? '8+' : n}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Household situations (select all that apply)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SITUATION_OPTIONS.map(({ value, label }) => {
                  const selected = (form.situation || []).includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleList('situation', value)}
                      className={`text-left px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-between gap-2
                        ${selected
                          ? 'bg-blue-50 border-blue-500 text-blue-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                    >
                      <span>{label}</span>
                      {selected && (
                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </Field>
          </Section>

          {/* Income */}
          <Section title="Income & Employment">
            <Field label="Monthly household income (before taxes)" required>
              <div className="grid grid-cols-1 gap-2">
                {INCOME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update('incomeRange', opt)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                      ${form.incomeRange === opt
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Employment status">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EMPLOYMENT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update('employmentStatus', value)}
                    className={`text-left px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                      ${form.employmentStatus === value
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* Current benefits */}
          <Section title="Benefits You Already Receive">
            <p className="text-sm text-slate-500 -mt-2">We'll focus on what you might be missing.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CURRENT_BENEFITS_OPTIONS.map(({ value, label }) => {
                const selected = (form.currentBenefits || []).includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleList('currentBenefits', value)}
                    className={`text-left px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-between gap-2
                      ${selected
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    <span>{label}</span>
                    {selected && (
                      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={!dirty}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-sm transition-all
                ${saved
                  ? 'bg-emerald-600 text-white'
                  : dirty
                    ? 'bg-slate-900 hover:bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              {saved ? 'Saved!' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={checkEligibility}
              disabled={!form.state || !form.householdSize || !form.incomeRange}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-sm transition-all
                ${(form.state && form.householdSize && form.incomeRange)
                  ? 'bg-blue-700 hover:bg-blue-800 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              Check eligibility with this info
            </button>
          </div>
          {(!form.state || !form.householdSize || !form.incomeRange) && (
            <p className="text-xs text-slate-400 -mt-3">Fill in state, household size, and income to check eligibility.</p>
          )}

        </div>
      </div>
    </Layout>
  )
}

const inputCls = 'w-full border-2 border-slate-200 focus:border-blue-500 rounded-lg px-4 py-2.5 text-slate-900 text-sm bg-white outline-none transition-colors'

function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5"> *</span>}
      </label>
      {children}
    </div>
  )
}

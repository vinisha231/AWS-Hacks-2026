import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { SUPPORTED_LANGUAGES } from '../i18n/translations'
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

const EMPLOYMENT_OPTIONS = [
  { value: 'employed_full',  label: 'Employed full-time' },
  { value: 'employed_part',  label: 'Employed part-time' },
  { value: 'self_employed',  label: 'Self-employed' },
  { value: 'unemployed',     label: 'Unemployed / looking for work' },
  { value: 'retired',        label: 'Retired' },
  { value: 'student',        label: 'Student' },
  { value: 'unable_to_work', label: 'Unable to work (disability)' },
]

const INCOME_OPTIONS = [
  'Under $1,000 / month',
  '$1,000 – $1,500 / month',
  '$1,500 – $2,000 / month',
  '$2,000 – $2,500 / month',
  '$2,500 – $3,500 / month',
  '$3,500 – $5,000 / month',
  'Over $5,000 / month',
  'Prefer not to say',
]

export default function Profile() {
  const { user, isAuthenticated } = useAuth()
  const { profile, setProfile, language, setLanguage, answers } = useStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:           profile.name      || user?.name      || '',
    email:          profile.email     || user?.email     || '',
    state:          profile.state     || answers.state   || '',
    householdSize:  profile.householdSize || answers.householdSize || '',
    dependents:     profile.dependents    || '',
    incomeRange:    profile.incomeRange   || answers.incomeRange   || '',
    employmentStatus: profile.employmentStatus || '',
    preferredLang:  profile.preferredLang || language || 'en',
  })
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); setSaved(false) }

  const save = (e) => {
    e.preventDefault()
    setProfile(form)
    if (form.preferredLang) setLanguage(form.preferredLang)
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">My Profile</h1>
            <p className="text-slate-500">Your information is used to personalize your benefit results.</p>
          </div>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/auth?redirect=/profile')}
              className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Sign in to save
            </button>
          )}
        </div>

        <form onSubmit={save} className="flex flex-col gap-6">
          {/* Personal info */}
          <Section title="Personal Information" icon="👤">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Maria Garcia"
                  className={inputCls}
                />
              </FormField>
              <FormField label="Email address">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </FormField>
            </div>
            <FormField label="State / Location">
              <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                <option value="">Select your state...</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </Section>

          {/* Household */}
          <Section title="Household Details" icon="🏠">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Household size (including you)">
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => set('householdSize', n)}
                      className={`py-2 rounded-xl border-2 font-bold text-sm transition-all
                        ${form.householdSize === n
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                    >
                      {n === 8 ? '8+' : n}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Number of dependents">
                <div className="grid grid-cols-4 gap-2">
                  {[0,1,2,3,4,5,6,7].map(n => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => set('dependents', n)}
                      className={`py-2 rounded-xl border-2 font-bold text-sm transition-all
                        ${form.dependents === n
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                    >
                      {n === 7 ? '7+' : n}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </Section>

          {/* Income & Employment */}
          <Section title="Income & Employment" icon="💼">
            <FormField label="Monthly household income (before taxes)">
              <div className="grid grid-cols-1 gap-2">
                {INCOME_OPTIONS.map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => set('incomeRange', opt)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                      ${form.incomeRange === opt
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Employment status">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {EMPLOYMENT_OPTIONS.map(({ value, label }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => set('employmentStatus', value)}
                    className={`text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                      ${form.employmentStatus === value
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FormField>
          </Section>

          {/* Language */}
          <Section title="Preferred Language" icon="🌍">
            <FormField label="Language for results and notifications">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.filter(l => !l.soon).map(lang => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => set('preferredLang', lang.code)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                      ${form.preferredLang === lang.code
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">More languages coming soon: Vietnamese, Haitian Creole, Arabic, Somali</p>
            </FormField>
          </Section>

          {/* Save */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={!dirty && !saved}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all
                ${saved
                  ? 'bg-emerald-600 text-white'
                  : dirty
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              {saved ? '✓ Saved!' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

const inputCls = 'w-full border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3 text-slate-900 text-sm bg-white outline-none transition-colors'

function Section({ title, icon, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

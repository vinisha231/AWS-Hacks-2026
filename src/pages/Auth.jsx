import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import LanguagePicker from '../components/LanguagePicker'

const PersonIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

const ICON_MAP = {
  person: <PersonIcon />,
  email: <EmailIcon />,
  lock: <LockIcon />,
}

export default function AuthPage() {
  const { login, register } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/home'

  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup') {
      if (!form.name.trim()) return setError('Please enter your name.')
      if (!form.email.trim()) return setError('Please enter your email.')
      if (form.password.length < 8) return setError('Password must be at least 8 characters.')
      if (form.password !== form.confirm) return setError('Passwords do not match.')
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password })
      } else {
        await register({ name: form.name, email: form.email, password: form.password })
      }
      navigate(redirect)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="font-bold text-xl text-slate-900">Compass</span>
        </Link>
        <LanguagePicker />
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                {mode === 'login' ? t('auth_welcome') : t('auth_create')}
              </h1>
              <p className="text-slate-500 text-sm">
                {mode === 'login'
                  ? t('auth_signin_desc')
                  : t('auth_signup_desc')}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-neutral-100 rounded-lg p-1 mb-8">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all
                    ${mode === m ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  {m === 'login' ? t('auth_tab_signin') : t('auth_tab_signup')}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <Field
                  label={t('auth_name_label')}
                  type="text"
                  placeholder="Maria Garcia"
                  value={form.name}
                  onChange={v => set('name', v)}
                  icon="person"
                  autoComplete="name"
                />
              )}
              <Field
                label={t('auth_email_label')}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={v => set('email', v)}
                icon="email"
                autoComplete="email"
              />
              <Field
                label={t('auth_password_label')}
                type="password"
                placeholder={mode === 'signup' ? t('auth_password_hint') : '••••••••'}
                value={form.password}
                onChange={v => set('password', v)}
                icon="lock"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (
                <Field
                  label={t('auth_confirm_label')}
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={v => set('confirm', v)}
                  icon="lock"
                  autoComplete="new-password"
                />
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5"><WarningIcon /></span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-bold py-3.5 rounded-md transition-all mt-2 flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {loading ? t('auth_submit_loading') : mode === 'login' ? t('auth_submit_signin') : t('auth_submit_signup')}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-400">{t('auth_or')}</span>
              </div>
            </div>

            <Link
              to="/intake"
              className="block w-full text-center text-sm font-medium text-neutral-600 hover:text-neutral-950 py-2 transition-colors"
            >
              {t('auth_no_account')}
            </Link>

            {mode === 'signup' && (
              <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
                {t('auth_privacy')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, placeholder, value, onChange, icon, autoComplete }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none flex items-center">
          {ICON_MAP[icon]}
        </span>
        <input
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="w-full border border-neutral-300 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-md pl-11 pr-11 py-3.5 text-neutral-950 text-sm bg-white outline-none transition-colors"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import LanguagePicker from '../components/LanguagePicker'

function CompassIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 text-neutral-950">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 12l-6 4-2 6 6-4 2-6z" fill="currentColor" opacity="0.8" />
    </svg>
  )
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
          <CompassIcon />
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
                  icon="👤"
                  autoComplete="name"
                />
              )}
              <Field
                label={t('auth_email_label')}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={v => set('email', v)}
                icon="✉️"
                autoComplete="email"
              />
              <Field
                label={t('auth_password_label')}
                type="password"
                placeholder={mode === 'signup' ? t('auth_password_hint') : '••••••••'}
                value={form.password}
                onChange={v => set('password', v)}
                icon="🔒"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (
                <Field
                  label={t('auth_confirm_label')}
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={v => set('confirm', v)}
                  icon="🔒"
                  autoComplete="new-password"
                />
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                  <span>⚠️</span>
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
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">{icon}</span>
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

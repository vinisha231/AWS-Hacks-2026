import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { SUPPORTED_LANGUAGES } from '../i18n/translations'
import { updatePassword } from '../services/auth'
import { useRevealAll } from '../hooks/useReveal'
import Layout from '../components/Layout'

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

export default function Settings() {
  const { user, isAuthenticated, logout, removeAccount } = useAuth()
  const { settings, setSettings, language, setLanguage } = useStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  useRevealAll()

  const [prefs, setPrefs] = useState({
    notifySMS:      settings.notifySMS   ?? false,
    notifyEmail:    settings.notifyEmail ?? true,
    phone:          settings.phone       ?? '',
    email:          settings.email       || user?.email || '',
    language:       settings.language    || language || 'en',
    shareAnonymous: settings.shareAnonymous ?? true,
    allowContact:   settings.allowContact   ?? false,
  })
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const set = (k, v) => { setPrefs(p => ({ ...p, [k]: v })); setDirty(true); setSaved(false) }

  const save = () => {
    setSettings(prefs)
    if (prefs.language) setLanguage(prefs.language)
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const changePassword = async () => {
    setPwError('')
    if (pwForm.new.length < 8) return setPwError('New password must be at least 8 characters.')
    if (pwForm.new !== pwForm.confirm) return setPwError('Passwords do not match.')
    try {
      await updatePassword({ email: user?.email, oldPassword: pwForm.old, newPassword: pwForm.new })
      setPwSuccess(true)
      setPwForm({ old: '', new: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm.toLowerCase() !== 'delete my account') return
    await removeAccount()
    navigate('/')
  }

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-12">
        <div className="max-w-2xl mx-auto">

          <div className="reveal mb-8">
            <h1 className="text-3xl font-black text-neutral-950 mb-1">Settings</h1>
            <p className="text-neutral-500">Manage notifications, language, and privacy preferences.</p>
          </div>

          <div className="flex flex-col gap-4">

            {/* Notifications */}
            <SettingsCard title="Notification Preferences" icon={<BellIcon />}>
              <p className="text-sm text-neutral-500 mb-5">
                We'll remind you 30 days before a benefit expires and alert you to renewal deadlines.
              </p>
              <Toggle
                label="Email notifications"
                description="Renewal reminders and application updates"
                checked={prefs.notifyEmail}
                onChange={v => set('notifyEmail', v)}
              />
              {prefs.notifyEmail && (
                <div className="ml-14 mt-3 animate-fade-in">
                  <label className="text-xs font-semibold text-neutral-500 block mb-1.5 uppercase tracking-wide">Email address</label>
                  <input
                    type="email"
                    value={prefs.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className="border border-neutral-300 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-md px-4 py-2.5 text-sm w-full outline-none transition-colors"
                  />
                </div>
              )}

              <div className="border-t border-neutral-100 my-5" />

              <Toggle
                label="SMS notifications"
                description="Text message reminders powered by Amazon SNS"
                checked={prefs.notifySMS}
                onChange={v => set('notifySMS', v)}
              />
              {prefs.notifySMS && (
                <div className="ml-14 mt-3 animate-fade-in">
                  <label className="text-xs font-semibold text-neutral-500 block mb-1.5 uppercase tracking-wide">Phone number</label>
                  <input
                    type="tel"
                    value={prefs.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="border border-neutral-300 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-md px-4 py-2.5 text-sm w-full outline-none transition-colors"
                  />
                  <p className="text-xs text-neutral-400 mt-1.5">Standard message rates may apply.</p>
                </div>
              )}
            </SettingsCard>

            {/* Language */}
            <SettingsCard title="Language Preference" icon={<GlobeIcon />}>
              <p className="text-sm text-neutral-500 mb-5">
                Your preferred language is used across all sessions. Non-English languages are translated via Amazon Translate — requires API connection.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.slice(0, 12).map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => set('language', lang.code)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm font-medium transition-all text-left
                      ${prefs.language === lang.code
                        ? 'bg-neutral-950 border-neutral-950 text-white'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                      }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-3">{SUPPORTED_LANGUAGES.length} total languages supported</p>
            </SettingsCard>

            {/* Privacy */}
            <SettingsCard title="Privacy & Data" icon={<ShieldIcon />}>
              <Toggle
                label="Share anonymous usage data"
                description="Helps improve eligibility results. Never includes personal info."
                checked={prefs.shareAnonymous}
                onChange={v => set('shareAnonymous', v)}
              />
              <div className="border-t border-neutral-100 my-5" />
              <Toggle
                label="Allow benefit agencies to contact me"
                description="Agencies may reach out with program updates or application assistance."
                checked={prefs.allowContact}
                onChange={v => set('allowContact', v)}
              />
              <div className="mt-5 text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 rounded-md p-3 leading-relaxed">
                Your data is stored locally on your device. We do not sell or share your personal information.
              </div>
            </SettingsCard>

            {/* Personal Info */}
            <SettingsCard title="Personal Information" icon={<UserIcon />}>
              <p className="text-sm text-neutral-500 mb-4">Update your name, household size, income, and benefit profile.</p>
              <button
                onClick={() => navigate('/profile')}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-neutral-950 hover:text-neutral-600 transition-colors"
              >
                Edit Profile
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </SettingsCard>

            {/* Save */}
            <div className="reveal flex items-center justify-between py-2">
              <button onClick={() => navigate(-1)} className="text-neutral-500 hover:text-neutral-700 text-sm font-medium transition-colors">
                ← Back
              </button>
              <button
                onClick={save}
                disabled={!dirty && !saved}
                className={`px-8 py-3 rounded-md font-bold text-sm transition-all
                  ${saved
                    ? 'bg-neutral-800 text-white'
                    : dirty
                      ? 'bg-neutral-950 hover:bg-neutral-800 text-white hover:-translate-y-0.5'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  }`}
              >
                {saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>

            {/* Auth section */}
            {isAuthenticated && (
              <div className="border-t border-neutral-200 pt-4 flex flex-col gap-4">

                {/* Change Password */}
                <SettingsCard title="Change Password" icon={<LockIcon />}>
                  <div className="flex flex-col gap-3">
                    <PwField label="Current password" value={pwForm.old} onChange={v => setPwForm(f => ({ ...f, old: v }))} />
                    <PwField label="New password" value={pwForm.new} onChange={v => setPwForm(f => ({ ...f, new: v }))} />
                    <PwField label="Confirm new password" value={pwForm.confirm} onChange={v => setPwForm(f => ({ ...f, confirm: v }))} />
                    {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                    {pwSuccess && <p className="text-sm text-emerald-600 font-semibold">Password updated!</p>}
                    <button
                      type="button"
                      onClick={changePassword}
                      className="self-start bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm px-5 py-2.5 rounded-md transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                </SettingsCard>

                {/* Delete Account */}
                <SettingsCard title="Delete Account" icon={<TrashIcon />}>
                  <p className="text-sm text-neutral-500 mb-4">
                    Permanently delete your account and all saved data. This cannot be undone.
                  </p>
                  {!showDelete ? (
                    <button
                      onClick={() => setShowDelete(true)}
                      className="text-red-600 hover:text-red-800 font-semibold text-sm transition-colors"
                    >
                      Delete my account →
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 flex flex-col gap-3">
                      <p className="text-sm text-red-700 font-medium">
                        Type <strong>delete my account</strong> to confirm:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="delete my account"
                        className="border border-red-300 focus:border-red-500 rounded-md px-4 py-2.5 text-sm outline-none transition-colors"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleDelete}
                          disabled={deleteConfirm.toLowerCase() !== 'delete my account'}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-md transition-all"
                        >
                          Permanently Delete
                        </button>
                        <button
                          onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                          className="text-neutral-500 font-medium text-sm px-4"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </SettingsCard>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  )
}

function SettingsCard({ title, icon, children }) {
  return (
    <div className="reveal bg-white border border-neutral-200 rounded-lg p-6 hover:border-neutral-300 transition-colors">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-neutral-400">{icon}</div>
        <h2 className="font-bold text-neutral-950">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-neutral-950' : 'bg-neutral-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <div>
        <p className="font-semibold text-neutral-900 text-sm">{label}</p>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

function PwField({ label, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-500 block mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-neutral-300 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-md px-4 py-2.5 text-sm outline-none transition-colors pr-16"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 font-medium"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

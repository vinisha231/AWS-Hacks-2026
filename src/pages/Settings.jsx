import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../store/store'
import { useTranslation } from '../hooks/useTranslation'
import { SUPPORTED_LANGUAGES } from '../i18n/translations'
import { updatePassword } from '../services/auth'
import Layout from '../components/Layout'

export default function Settings() {
  const { user, isAuthenticated, logout, removeAccount } = useAuth()
  const { settings, setSettings, language, setLanguage } = useStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [prefs, setPrefs] = useState({
    notifySMS:   settings.notifySMS   ?? false,
    notifyEmail: settings.notifyEmail ?? true,
    phone:       settings.phone       ?? '',
    email:       settings.email       || user?.email || '',
    language:    settings.language    || language || 'en',
    shareAnonymous: settings.shareAnonymous ?? true,
    allowContact:   settings.allowContact   ?? false,
  })
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Password change
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // Delete account
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
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-1">Settings</h1>
          <p className="text-slate-500">Manage your notifications, language, and privacy preferences.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Notification Preferences */}
          <SettingsCard title="Notification Preferences" icon="🔔">
            <p className="text-sm text-slate-500 mb-4">
              We'll remind you 30 days before a benefit expires and alert you to renewal deadlines.
            </p>

            <Toggle
              label="Email notifications"
              description="Renewal reminders and application updates"
              checked={prefs.notifyEmail}
              onChange={v => set('notifyEmail', v)}
            />
            {prefs.notifyEmail && (
              <div className="ml-14 mt-2 animate-fade-in">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Email address</label>
                <input
                  type="email"
                  value={prefs.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm w-full outline-none transition-colors"
                />
              </div>
            )}

            <div className="border-t border-slate-100 my-4" />

            <Toggle
              label="SMS notifications"
              description="Text message reminders (works on any phone)"
              checked={prefs.notifySMS}
              onChange={v => set('notifySMS', v)}
            />
            {prefs.notifySMS && (
              <div className="ml-14 mt-2 animate-fade-in">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Phone number</label>
                <input
                  type="tel"
                  value={prefs.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm w-full outline-none transition-colors"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  SMS powered by Amazon SNS. Standard message rates may apply.
                </p>
              </div>
            )}
          </SettingsCard>

          {/* Language Preference */}
          <SettingsCard title="Language Preference" icon="🌍">
            <p className="text-sm text-slate-500 mb-4">
              Your preferred language will be used across all sessions and notifications.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.filter(l => !l.soon).map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => set('language', lang.code)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                    ${prefs.language === lang.code
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {prefs.language === lang.code && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">More languages coming soon: Vietnamese, Haitian Creole, Arabic, Somali</p>
          </SettingsCard>

          {/* Privacy */}
          <SettingsCard title="Privacy & Data Sharing" icon="🔐">
            <Toggle
              label="Share anonymous usage data"
              description="Helps us improve eligibility results for everyone. Never includes personal info."
              checked={prefs.shareAnonymous}
              onChange={v => set('shareAnonymous', v)}
            />
            <div className="border-t border-slate-100 my-4" />
            <Toggle
              label="Allow benefit agencies to contact me"
              description="Agencies may reach out with program updates or application assistance."
              checked={prefs.allowContact}
              onChange={v => set('allowContact', v)}
            />
            <div className="mt-4 text-xs text-slate-400 bg-slate-50 rounded-xl p-3 leading-relaxed">
              Your data is stored locally on your device. We do not sell or share your personal information.
              For questions, see our privacy policy.
            </div>
          </SettingsCard>

          {/* Personal Info Link */}
          <SettingsCard title="Personal Information" icon="👤">
            <p className="text-sm text-slate-500 mb-4">Update your name, household size, income, and other profile details.</p>
            <button
              onClick={() => navigate('/profile')}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1 transition-colors"
            >
              Edit Profile →
            </button>
          </SettingsCard>

          {/* Save button */}
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
              ← Back
            </button>
            <button
              onClick={save}
              disabled={!dirty && !saved}
              className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all
                ${saved
                  ? 'bg-emerald-600 text-white'
                  : dirty
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 pt-6">
            {/* Change Password */}
            {isAuthenticated && (
              <SettingsCard title="Change Password" icon="🔑">
                <div className="flex flex-col gap-3">
                  <PwField label="Current password" value={pwForm.old} onChange={v => setPwForm(f => ({ ...f, old: v }))} />
                  <PwField label="New password" value={pwForm.new} onChange={v => setPwForm(f => ({ ...f, new: v }))} />
                  <PwField label="Confirm new password" value={pwForm.confirm} onChange={v => setPwForm(f => ({ ...f, confirm: v }))} />
                  {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                  {pwSuccess && <p className="text-sm text-emerald-600 font-semibold">✓ Password updated!</p>}
                  <button
                    type="button"
                    onClick={changePassword}
                    className="self-start bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </SettingsCard>
            )}

            {/* Delete Account */}
            {isAuthenticated && (
              <div className="mt-6">
                <SettingsCard title="Delete Account" icon="🗑️">
                  <p className="text-sm text-slate-500 mb-4">
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
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3">
                      <p className="text-sm text-red-700 font-medium">
                        Type <strong>delete my account</strong> to confirm:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="delete my account"
                        className="border-2 border-red-300 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm outline-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleDelete}
                          disabled={deleteConfirm.toLowerCase() !== 'delete my account'}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
                        >
                          Permanently Delete
                        </button>
                        <button
                          onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                          className="text-slate-500 font-medium text-sm px-4"
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">{icon}</span>
        <h2 className="font-bold text-slate-900">{title}</h2>
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
        className={`relative mt-0.5 w-11 h-6 rounded-full transition-colors flex-shrink-0
          ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      <div>
        <p className="font-semibold text-slate-900 text-sm">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

function PwField({ label, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors pr-16"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

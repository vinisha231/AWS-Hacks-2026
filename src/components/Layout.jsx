import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import { useStore } from '../store/store'
import LanguagePicker from './LanguagePicker'
import { FloatingChatbot } from './FloatingChatbot'

function RtaLogo() {
  return (
    <span
      className="flex items-center justify-center w-8 h-8 rounded-lg text-white font-black text-base leading-none select-none flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#fbbf24,#fb923c,#fb7185)', fontFamily: 'system-ui,sans-serif' }}
      aria-hidden="true"
    >
      ऋ
    </span>
  )
}

function UserMenu({ user, onLogout, t }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        <span className="w-6 h-6 rounded bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-24 truncate">
          {user.name || user.email}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm truncate">{user.name || 'My Account'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            {[
              { label: t('nav_profile'), path: '/profile' },
              { label: 'Settings',      path: '/settings' },
              { label: t('nav_tracker'), path: '/tracker' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-gray-100">
              <button
                onClick={() => { onLogout(); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
              >
                {t('nav_signout')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuth()
  const tracker = useStore(s => s.tracker)
  const trackerCount = Object.keys(tracker).length
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Navbar: always white, always static, never animates ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-8 h-14 flex items-center justify-between gap-6">
          {/* Logo — static, no hover effects */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 pointer-events-auto">
            <RtaLogo />
            <span className="font-black text-base text-gray-900 tracking-tight">Rta</span>
          </Link>

          <div className="hidden sm:flex items-center gap-7">
            <NavLink to="/tracker" label={t('nav_tracker')} badge={trackerCount} active={location.pathname === '/tracker'} />
            <NavLink to="/profile" label={t('nav_profile')} active={location.pathname === '/profile'} />
          </div>

          <div className="flex items-center gap-3">
            <LanguagePicker />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/intake"
                  className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  {t('nav_start')}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <UserMenu user={user} onLogout={handleLogout} t={t} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth"
                  className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {t('nav_signin')}
                </Link>
                <Link
                  to="/intake"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  {t('nav_start')}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <FloatingChatbot />

      <footer className="bg-gray-50 border-t border-gray-200 py-8 px-8">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <RtaLogo />
            <span className="font-black text-gray-900 text-sm">Rta</span>
          </div>
          <span className="text-gray-400 text-xs text-center">{t('landing_footer')}</span>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <Link to="/intake" className="hover:text-gray-900 transition-colors">{t('nav_start')}</Link>
            <Link to="/tracker" className="hover:text-gray-900 transition-colors">{t('nav_tracker')}</Link>
            <Link to="/profile" className="hover:text-gray-900 transition-colors">Profile</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, label, badge, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 text-sm font-medium transition-colors
        ${active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
    >
      {label}
      {badge > 0 && (
        <span className="bg-gray-900 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

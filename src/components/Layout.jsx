import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import { useStore } from '../store/store'
import LanguagePicker from './LanguagePicker'

function CompassLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5 text-white">
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
      <path d="M14 3v3M14 22v3M3 14h3M22 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 10.5l-5 3.5-1.5 4 5-3.5 1.5-4z" fill="currentColor" opacity="0.85" />
    </svg>
  )
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
      >
        <span className="w-6 h-6 rounded bg-white text-neutral-950 text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span className="text-sm font-medium text-neutral-300 hidden sm:block max-w-24 truncate">
          {user.name || user.email}
        </span>
        <svg className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-20">
            <div className="px-4 py-3 border-b border-neutral-800">
              <p className="font-semibold text-white text-sm truncate">{user.name || 'My Account'}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
            {[
              { label: 'My Profile',      path: '/profile' },
              { label: 'Settings',        path: '/settings' },
              { label: 'My Applications', path: '/tracker' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-neutral-800">
              <button
                onClick={() => { onLogout(); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-neutral-800 transition-colors"
              >
                Sign out
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
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <nav className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-8 h-14 flex items-center justify-between gap-6">
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <CompassLogo />
            <span className="font-bold text-base text-white tracking-tight">Compass</span>
          </Link>

          <div className="hidden sm:flex items-center gap-7">
            <NavLink to="/tracker" label={t('nav_tracker')} badge={trackerCount} active={location.pathname === '/tracker'} />
            <NavLink to="/profile" label="My Profile" active={location.pathname === '/profile'} />
          </div>

          <div className="flex items-center gap-3">
            <LanguagePicker />
            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth"
                  className="hidden sm:block text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/intake"
                  className="group inline-flex items-center gap-1.5 bg-white hover:bg-neutral-100 text-neutral-950 text-sm font-semibold px-4 py-2 rounded-md transition-all hover:shadow-lg hover:shadow-white/10"
                >
                  {t('nav_start')}
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-neutral-950 border-t border-neutral-800 py-10 px-8">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CompassLogo />
            <span className="font-semibold text-white text-sm">Compass</span>
          </div>
          <span className="text-neutral-600 text-xs text-center">{t('landing_footer')}</span>
          <div className="flex items-center gap-5 text-xs text-neutral-600">
            <Link to="/intake" className="hover:text-white transition-colors">{t('nav_start')}</Link>
            <Link to="/tracker" className="hover:text-white transition-colors">{t('nav_tracker')}</Link>
            <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
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
        ${active ? 'text-white' : 'text-neutral-500 hover:text-neutral-200'}`}
    >
      {label}
      {badge > 0 && (
        <span className="bg-white text-neutral-950 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import { useStore } from '../store/store'
import LanguagePicker from './LanguagePicker'

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
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
      >
        <span className="w-6 h-6 rounded bg-neutral-950 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span className="text-sm font-medium text-neutral-700 hidden sm:block max-w-24 truncate">
          {user.name || user.email}
        </span>
        <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
            <div className="px-4 py-3 border-b border-neutral-100">
              <p className="font-semibold text-neutral-900 text-sm truncate">{user.name || 'My Account'}</p>
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
                className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-neutral-100">
              <button
                onClick={() => { onLogout(); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link to="/" className="flex-shrink-0">
            <span className="font-bold text-lg text-neutral-950 tracking-tight">Compass</span>
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
                  className="hidden sm:block text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/intake"
                  className="bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  {t('nav_start')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-neutral-950 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-white text-sm">Compass</span>
          <span className="text-neutral-500 text-xs text-center">{t('landing_footer')}</span>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <Link to="/intake" className="hover:text-white transition-colors">{t('nav_start')}</Link>
            <Link to="/tracker" className="hover:text-white transition-colors">{t('nav_tracker')}</Link>
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
        ${active ? 'text-neutral-950' : 'text-neutral-500 hover:text-neutral-900'}`}
    >
      {label}
      {badge > 0 && (
        <span className="bg-neutral-950 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

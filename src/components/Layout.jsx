import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import { useStore } from '../store/store'
import LanguagePicker from './LanguagePicker'

function CompassIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 12l-6 4-2 6 6-4 2-6z" fill="currentColor" opacity="0.8" />
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
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-24 truncate">
          {user.name || user.email}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden animate-scale-in">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-slate-900 text-sm truncate">{user.name || 'My Account'}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            {[
              { label: '👤  My Profile', path: '/profile' },
              { label: '⚙️  Settings',   path: '/settings' },
              { label: '📋  My Applications', path: '/tracker' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-slate-100">
              <button
                onClick={() => { onLogout(); setOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                🚪  Sign out
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 text-blue-700 hover:text-blue-800 transition-colors flex-shrink-0">
            <CompassIcon />
            <span className="font-bold text-xl text-slate-900 tracking-tight">Compass</span>
          </Link>

          {/* Center nav */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/tracker" label={t('nav_tracker')} badge={trackerCount} active={location.pathname === '/tracker'} />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguagePicker />
            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="hidden sm:block text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/intake"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  {t('nav_start')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-400">
        {t('landing_footer')}
      </footer>
    </div>
  )
}

function NavLink({ to, label, badge, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
        ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
    >
      {label}
      {badge > 0 && (
        <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

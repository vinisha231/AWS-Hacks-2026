import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEmberStore } from '../store/emberStore'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { HomeIcon, ActivityIcon, PersonIcon, HeartIcon } from './Icons'
import FlareLogo from './FlareLogo'
import FloatingHobbies from './FloatingHobbies'

const APP_NAME = 'Flare'

const NAV = [
  { to: '/home',     Icon: HomeIcon,     label: 'Home'    },
  { to: '/activity', Icon: ActivityIcon, label: 'Activity'},
  { to: '/connect',  Icon: HeartIcon,    label: 'Connect' },
  { to: '/profile',  Icon: PersonIcon,   label: 'Profile' },
]

export default function Layout({ children }) {
  const { logout, user } = useAuth()
  const { dayCount, userInterests } = useEmberStore()

  return (
    <div className="min-h-screen text-stone-800 flex relative" style={{ background: '#f7f3ec' }}>
      {/* Global hobby floaters — appears behind all page content */}
      <FloatingHobbies interests={userInterests || []} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-stone-200/80 px-3 py-6 fixed h-full bg-white/60 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2.5 px-3 mb-10">
          <FlareLogo size={22} className="text-amber-500" />
          <span className="font-black text-xl tracking-tight text-stone-900">{APP_NAME}</span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-amber-100 text-amber-700' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/80'}`}>
              {({ isActive }) => (
                <><Icon size={18} className={isActive ? 'text-amber-600' : 'text-stone-400'} />{label}</>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-1 flex flex-col gap-3">
          {user?.username && (
            <div className="px-3 py-2">
              <p className="text-stone-400 text-xs">Signed in as</p>
              <p className="text-stone-700 text-sm font-medium truncate">{user.username}</p>
            </div>
          )}
          <div className="px-3 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-stone-400 text-xs mb-1">Streak</p>
            <p className="text-amber-600 font-black text-2xl leading-none">
              {dayCount}<span className="text-stone-400 text-sm font-normal ml-1">days</span>
            </p>
          </div>
          <WalletMultiButton style={{ background: '#f5f0e8', color: '#1c1917', fontSize: '11px', width: '100%', justifyContent: 'center', borderRadius: '12px', border: '1px solid #e7e0d4' }} />
          <button onClick={logout}
            className="text-stone-400 hover:text-stone-600 text-xs py-1 transition-colors text-center">
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlareLogo size={18} className="text-amber-500" />
          <span className="font-black text-lg text-stone-900">{APP_NAME}</span>
        </div>
        <span className="text-amber-600 font-bold text-sm">{dayCount} days</span>
      </div>

      {/* Main — full width, no max-w; each page manages its own layout */}
      <main className="flex-1 md:ml-56 pt-[60px] md:pt-0 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-stone-200 grid grid-cols-4">
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-3 gap-1 text-[10px] font-medium transition-colors
              ${isActive ? 'text-amber-600' : 'text-stone-400'}`}>
            {({ isActive }) => (
              <><Icon size={20} className={isActive ? 'text-amber-600' : 'text-stone-400'} />{label}</>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Standard contained page shell for non-home pages */
export function PageShell({ children }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {children}
    </div>
  )
}

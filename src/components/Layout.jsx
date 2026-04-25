import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEmberStore } from '../store/emberStore'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { HomeIcon, ActivityIcon, PersonIcon, HeartIcon } from './Icons'
import FlareLogo from './FlareLogo'
import FloatingHobbies from './FloatingHobbies'

const BG = '#e8f4e8'
const APP_NAME = 'Flare'

const NAV = [
  { to: '/home',     Icon: HomeIcon,     label: 'Home'    },
  { to: '/activity', Icon: ActivityIcon, label: 'Activity'},
  { to: '/connect',  Icon: HeartIcon,    label: 'Connect' },
  { to: '/profile',  Icon: PersonIcon,   label: 'Profile' },
]

export default function Layout({ children, noHobbies = false, rightPanel = null }) {
  const { logout, user } = useAuth()
  const { dayCount, userInterests } = useEmberStore()

  return (
    <div className="min-h-screen text-stone-800 flex relative" style={{ background: BG }}>
      {!noHobbies && <FloatingHobbies interests={userInterests || []} />}

      {/* Desktop left sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-green-200/80 px-3 py-6 fixed h-full z-30"
        style={{ background: 'rgba(220,240,220,0.7)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5 px-3 mb-10">
          <FlareLogo size={22} className="text-green-600" />
          <span className="font-black text-xl tracking-tight text-stone-900">{APP_NAME}</span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-green-200 text-green-800' : 'text-stone-500 hover:text-stone-800 hover:bg-green-100/60'}`}>
              {({ isActive }) => (
                <><Icon size={18} className={isActive ? 'text-green-700' : 'text-stone-400'} />{label}</>
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
          <div className="px-3 py-3 rounded-xl bg-green-100 border border-green-200">
            <p className="text-stone-400 text-xs mb-1">Streak</p>
            <p className="text-green-700 font-black text-2xl leading-none">
              {dayCount}<span className="text-stone-400 text-sm font-normal ml-1">days</span>
            </p>
          </div>
          <WalletMultiButton style={{ background: '#d4ead4', color: '#1c1917', fontSize: '11px', width: '100%', justifyContent: 'center', borderRadius: '12px', border: '1px solid #b8d8b8' }} />
          <button onClick={logout}
            className="text-stone-400 hover:text-stone-600 text-xs py-1 transition-colors text-center">
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-green-200 px-5 py-4 flex items-center justify-between"
        style={{ background: 'rgba(220,240,220,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <FlareLogo size={18} className="text-green-600" />
          <span className="font-black text-lg text-stone-900">{APP_NAME}</span>
        </div>
        <span className="text-green-700 font-bold text-sm">{dayCount} days</span>
      </div>

      {/* Main content */}
      <main className={`flex-1 md:ml-56 ${rightPanel ? 'md:mr-72' : ''} pt-[60px] md:pt-0 pb-20 md:pb-0 min-h-screen`}>
        {children}
      </main>

      {/* Desktop right panel */}
      {rightPanel && (
        <aside className="hidden md:flex flex-col fixed right-0 top-0 bottom-0 w-72 border-l border-green-200 z-20 overflow-hidden">
          {rightPanel}
        </aside>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-green-200 grid grid-cols-4"
        style={{ background: 'rgba(220,240,220,0.92)', backdropFilter: 'blur(12px)' }}>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-3 gap-1 text-[10px] font-medium transition-colors
              ${isActive ? 'text-green-700' : 'text-stone-400'}`}>
            {({ isActive }) => (
              <><Icon size={20} className={isActive ? 'text-green-700' : 'text-stone-400'} />{label}</>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageShell({ children }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {children}
    </div>
  )
}

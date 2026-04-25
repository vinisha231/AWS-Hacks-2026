import { NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useEmberStore } from '../store/emberStore'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { HomeIcon, ActivityIcon, PersonIcon, HeartIcon, FlameIcon } from './Icons'

const NAV = [
  { to: '/home',         Icon: HomeIcon,     label: 'Home'     },
  { to: '/activity',     Icon: ActivityIcon, label: 'Activity' },
  { to: '/profile',      Icon: PersonIcon,   label: 'Profile'  },
  { to: '/support-view', Icon: HeartIcon,    label: 'Support'  },
]

export default function Layout({ children }) {
  const { logout } = useAuth0()
  const { dayCount } = useEmberStore()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/[0.06] px-3 py-6 fixed h-full">

        <div className="flex items-center gap-2.5 px-3 mb-10">
          <FlameIcon size={22} className="text-amber-500" />
          <span className="font-black text-xl tracking-tight">Ember</span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-stone-500 hover:text-white hover:bg-white/[0.04]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-amber-400' : 'text-stone-500'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-1 flex flex-col gap-3">
          <div className="px-3 py-3 rounded-xl bg-stone-900 border border-white/[0.06]">
            <p className="text-stone-500 text-xs mb-1">Streak</p>
            <p className="text-amber-400 font-black text-2xl leading-none">
              {dayCount}<span className="text-stone-600 text-sm font-normal ml-1">days</span>
            </p>
          </div>
          <WalletMultiButton style={{ background: '#161616', fontSize: '12px', width: '100%', justifyContent: 'center', borderRadius: '12px' }} />
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="text-stone-700 hover:text-stone-400 text-xs py-1 transition-colors text-center"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlameIcon size={18} className="text-amber-500" />
          <span className="font-black text-lg">Ember</span>
        </div>
        <span className="text-amber-400 font-bold text-sm">{dayCount} days</span>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-[60px] md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 md:px-10 py-6 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/[0.06] grid grid-cols-4">
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-3 gap-1 text-[10px] font-medium transition-colors
              ${isActive ? 'text-amber-400' : 'text-stone-600'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-amber-400' : 'text-stone-600'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

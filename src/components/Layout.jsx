import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useEmberStore } from '../store/emberStore'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

const NAV = [
  { to: '/home',     icon: '🏠', label: 'Home'     },
  { to: '/activity', icon: '📊', label: 'Activity'  },
  { to: '/profile',  icon: '👤', label: 'Profile'   },
  { to: '/support-view', icon: '❤️', label: 'Support'  },
]

export default function Layout({ children }) {
  const { logout } = useAuth0()
  const { dayCount } = useEmberStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/5 px-4 py-6 fixed h-full">
        <div className="flex items-center gap-2.5 px-3 mb-10">
          <span className="text-2xl">🔥</span>
          <span className="font-black text-xl tracking-tight">Ember</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'}`
              }
            >
              <span className="text-base">{icon}</span> {label}
            </NavLink>
          ))}
        </nav>

        {/* Streak badge */}
        <div className="mx-1 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-stone-400 text-xs mb-0.5">Current streak</p>
          <p className="text-amber-400 font-black text-2xl leading-none">{dayCount} <span className="text-sm font-normal text-stone-500">days</span></p>
        </div>

        <div className="flex flex-col gap-2 px-1">
          <WalletMultiButton style={{ background: '#1a1a1a', fontSize: '12px', width: '100%', justifyContent: 'center' }} />
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="text-stone-600 hover:text-stone-400 text-xs py-1.5 transition-colors text-center"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-black text-lg">Ember</span>
        </div>
        <button onClick={() => navigate('/profile')} className="text-stone-400 hover:text-white">
          👤
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-64 pt-[60px] md:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-t border-white/5 flex">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors
              ${isActive ? 'text-amber-400' : 'text-stone-500'}`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

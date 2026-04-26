import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEmberStore } from '../store/emberStore'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { HomeIcon, ActivityIcon, PersonIcon, HeartIcon } from './Icons'
import FloatingHobbies from './FloatingHobbies'

const BG   = '#FAF3E0'
const RUST = '#C94B2C'

const NAV = [
  { to: '/home',     Icon: HomeIcon,     label: 'Home'     },
  { to: '/activity', Icon: ActivityIcon, label: 'Activity' },
  { to: '/connect',  Icon: HeartIcon,    label: 'Connect'  },
  { to: '/profile',  Icon: PersonIcon,   label: 'Profile'  },
]

export default function Layout({ children, noHobbies = false, rightPanel = null }) {
  const { logout, user } = useAuth()
  const { dayCount, userInterests } = useEmberStore()

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', position: 'relative' }}>
      {!noHobbies && <FloatingHobbies interests={userInterests || []} />}

      {/* Desktop left sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r fixed h-full z-30"
        style={{ background: 'rgba(250,243,224,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(44,36,22,0.1)' }}>
        <div className="flex items-center gap-2.5 px-5 mb-10 pt-6">
          <span style={{ fontSize: '22px' }}>🔥</span>
          <span className="serif" style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.15em', color: '#2C2416' }}>FLARE</span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1 px-2">
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'text-white' : 'text-stone-500 hover:text-stone-800 hover:bg-black/5'}`}
              style={({ isActive }) => isActive ? { background: RUST } : {}}>
              {({ isActive }) => (
                <><Icon size={17} style={{ color: isActive ? '#fff' : '#8C7A5A' }} />{label}</>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-6 flex flex-col gap-3">
          {user?.username && (
            <div className="px-3 py-2">
              <p style={{ fontSize: '11px', color: '#8C7A5A' }}>Signed in as</p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#2C2416' }} className="truncate">{user.username}</p>
            </div>
          )}
          <div className="px-3 py-3 rounded-2xl" style={{ background: 'rgba(201,75,44,0.08)', border: '1px solid rgba(201,75,44,0.15)' }}>
            <p style={{ fontSize: '11px', color: '#8C7A5A', marginBottom: '2px' }}>Streak</p>
            <p className="serif" style={{ fontSize: '2rem', fontWeight: 700, color: RUST, lineHeight: 1 }}>
              {dayCount}<span style={{ fontSize: '12px', color: '#8C7A5A', fontFamily: 'Inter', fontWeight: 400, marginLeft: '4px' }}>days</span>
            </p>
          </div>
          <WalletMultiButton style={{ background: 'rgba(44,36,22,0.06)', color: '#2C2416', fontSize: '11px', width: '100%', justifyContent: 'center', borderRadius: '12px', border: '1px solid rgba(44,36,22,0.1)' }} />
          <button onClick={logout} style={{ color: '#8C7A5A', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b px-5 py-4 flex items-center justify-between"
        style={{ background: 'rgba(250,243,224,0.92)', backdropFilter: 'blur(12px)', borderColor: 'rgba(44,36,22,0.1)' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span className="serif" style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.15em', color: '#2C2416' }}>FLARE</span>
        </div>
        <span className="serif" style={{ color: RUST, fontWeight: 700, fontSize: '1rem' }}>{dayCount} days</span>
      </div>

      {/* Main content */}
      <main className={`flex-1 md:ml-52 ${rightPanel ? 'md:mr-72' : ''} pt-[60px] md:pt-0 pb-20 md:pb-0 min-h-screen`}>
        {children}
      </main>

      {/* Desktop right panel */}
      {rightPanel && (
        <aside className="hidden md:flex flex-col fixed right-0 top-0 bottom-0 w-72 border-l z-20 overflow-hidden"
          style={{ borderColor: 'rgba(44,36,22,0.1)' }}>
          {rightPanel}
        </aside>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t grid grid-cols-4"
        style={{ background: 'rgba(250,243,224,0.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(44,36,22,0.1)' }}>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-3 gap-1 text-[10px] font-medium transition-colors
              ${isActive ? 'text-[#C94B2C]' : 'text-stone-400'}`}>
            {({ isActive }) => (
              <><Icon size={20} style={{ color: isActive ? RUST : '#8C7A5A' }} />{label}</>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageShell({ children }) {
  return <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>{children}</div>
}

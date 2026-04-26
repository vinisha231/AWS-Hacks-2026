import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEmberStore } from '../store/emberStore'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { HomeIcon, ActivityIcon, PersonIcon, HeartIcon } from './Icons'
import FlareLogo from './FlareLogo'
import FloatingHobbies from './FloatingHobbies'

const RUST  = '#C94B2C'
const CREAM = '#FAF3E0'
const DARK  = '#2C2416'
const MID   = '#8C7A5A'

const NAV = [
  { to: '/home',     Icon: HomeIcon,     label: 'Home'     },
  { to: '/activity', Icon: ActivityIcon, label: 'Activity' },
  { to: '/connect',  Icon: HeartIcon,    label: 'Connect'  },
  { to: '/profile',  Icon: PersonIcon,   label: 'Profile'  },
]

export default function Layout({ children, noHobbies = false, rightPanel = null }) {
  const { logout, user } = useAuth()
  const { dayCount, userInterests } = useEmberStore()
  const [collapsed, setCollapsed] = useState(false)

  const sideW = collapsed ? '60px' : '208px'

  return (
    <div style={{ minHeight: '100vh', background: CREAM, display: 'flex', position: 'relative' }}>
      {!noHobbies && <FloatingHobbies interests={userInterests || []} />}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed h-full z-30 transition-all duration-300"
        style={{
          width: sideW,
          background: 'rgba(250,243,224,0.9)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(44,36,22,0.1)',
          overflow: 'hidden',
        }}>

        {/* Logo row + collapse button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: collapsed ? '1.5rem 0.75rem' : '1.5rem 1rem 1.5rem 1.25rem' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlareLogo size={26} />
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.18em', color: DARK }}>
                FLARE
              </span>
            </div>
          )}
          {collapsed && <FlareLogo size={26} style={{ margin: '0 auto' }} />}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'none',
              border: '1px solid rgba(44,36,22,0.15)',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '3px 6px',
              color: MID,
              fontSize: '11px',
              lineHeight: 1,
              flexShrink: 0,
              marginLeft: collapsed ? 'auto' : '0',
              display: 'flex',
              alignItems: 'center',
              gap: '1px',
            }}>
            {collapsed ? (
              <span style={{ letterSpacing: '-1px' }}>│▶</span>
            ) : (
              <span style={{ letterSpacing: '-1px' }}>◀│</span>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, padding: '0 8px' }}>
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 12px' : '10px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? RUST : 'transparent',
                color: isActive ? '#fff' : MID,
                transition: 'all 0.15s',
              })}>
              {({ isActive }) => (
                <>
                  <Icon size={17} style={{ color: isActive ? '#fff' : MID, flexShrink: 0 }} />
                  {!collapsed && label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        {!collapsed && (
          <div style={{ padding: '0 12px 24px' }}>
            <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', color: MID }}>Signed in as</p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: DARK }} className="truncate">{user?.username}</p>
            </div>
            <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(201,75,44,0.08)', border: '1px solid rgba(201,75,44,0.15)', marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', color: MID, marginBottom: '2px' }}>Streak</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 700, color: RUST, lineHeight: 1 }}>
                {dayCount}<span style={{ fontSize: '12px', color: MID, fontFamily: 'Inter, sans-serif', fontWeight: 400, marginLeft: '4px' }}>days</span>
              </p>
            </div>
            <WalletMultiButton style={{ background: 'rgba(44,36,22,0.06)', color: DARK, fontSize: '11px', width: '100%', justifyContent: 'center', borderRadius: '12px', border: '1px solid rgba(44,36,22,0.1)', marginBottom: '4px' }} />
            <button onClick={logout} style={{ color: MID, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: '6px', textAlign: 'center' }}>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(250,243,224,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(44,36,22,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FlareLogo size={20} />
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.15em', color: DARK }}>FLARE</span>
        </div>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', color: RUST, fontWeight: 700, fontSize: '1rem' }}>{dayCount} days</span>
      </div>

      {/* Main content */}
      <main className={`flex-1 pt-[60px] md:pt-0 pb-20 md:pb-0 min-h-screen transition-all duration-300`}
        style={{ marginLeft: collapsed ? '60px' : '208px', marginRight: rightPanel ? '288px' : '0' }}>
        {children}
      </main>

      {/* Right panel */}
      {rightPanel && (
        <aside className="hidden md:flex flex-col fixed right-0 top-0 bottom-0 z-20 overflow-hidden"
          style={{ width: '288px', borderLeft: '1px solid rgba(44,36,22,0.1)' }}>
          {rightPanel}
        </aside>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4"
        style={{ background: 'rgba(250,243,224,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(44,36,22,0.1)' }}>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0', gap: '3px', fontSize: '10px', fontWeight: 500,
              textDecoration: 'none', color: isActive ? RUST : MID,
            })}>
            {({ isActive }) => (
              <><Icon size={20} style={{ color: isActive ? RUST : MID }} />{label}</>
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

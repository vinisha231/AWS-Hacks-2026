import { useState } from 'react'

const ZONES = [
  { id: 1, name: 'Starting Village',  emoji: '🏘️', day: 0,   x: 83, y: 78, desc: 'Where every journey begins.' },
  { id: 2, name: 'Meadow Path',       emoji: '🌿', day: 3,   x: 66, y: 72, desc: '3 days of strength.' },
  { id: 3, name: 'River Crossing',    emoji: '🌊', day: 7,   x: 56, y: 60, desc: 'One week. The first real win.' },
  { id: 4, name: 'Stone Ridge',       emoji: '⛰️', day: 14,  x: 42, y: 55, desc: 'Two weeks of resolve.' },
  { id: 5, name: 'Ancient Ruins',     emoji: '🏛️', day: 21,  x: 60, y: 42, desc: 'Three weeks. The habit breaks here.' },
  { id: 6, name: 'Forest Sanctuary',  emoji: '🌲', day: 30,  x: 32, y: 38, desc: 'One month. Legendary.' },
  { id: 7, name: 'Mountain Pass',     emoji: '🏔️', day: 45,  x: 22, y: 28, desc: '45 days of pure willpower.' },
  { id: 8, name: 'Glacier Peak',      emoji: '❄️', day: 60,  x: 12, y: 16, desc: 'Two months. Most never reach this.' },
  { id: 9, name: 'Summit — The Peak', emoji: '👑', day: 100, x: 8,  y: 6,  desc: '100 days. You are free.' },
]

function lerp(a, b, t) { return a + (b - a) * t }

function Trail({ zones, currentIdx }) {
  const segments = []
  for (let i = 0; i < zones.length - 1; i++) {
    const z1 = zones[i], z2 = zones[i + 1]
    const mx = lerp(z1.x, z2.x, 0.5)
    const my = lerp(z1.y, z2.y, 0.5)
    const unlocked = i < currentIdx
    segments.push(
      <path key={i}
        d={`M ${z1.x}% ${z1.y}% Q ${mx}% ${my + 3}% ${z2.x}% ${z2.y}%`}
        fill="none"
        stroke={unlocked ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
        strokeWidth={unlocked ? '0.4%' : '0.25%'}
        strokeDasharray={unlocked ? 'none' : '1.5% 1%'}
        strokeLinecap="round"
        style={{ filter: unlocked ? 'drop-shadow(0 0 4px rgba(245,158,11,0.8))' : 'none' }}
      />
    )
  }
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
      {segments}
    </svg>
  )
}

export default function RecoveryMap({ dayCount = 0 }) {
  const [selected, setSelected] = useState(null)
  const currentIdx = ZONES.reduce((acc, z, i) => dayCount >= z.day ? i : acc, 0)

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none"
      onClick={() => setSelected(null)}>

      {/* Background map image */}
      <img
        src="/map.jpg"
        alt="Recovery Map"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Locked zone fog blobs */}
      {ZONES.map((zone, i) => {
        if (i <= currentIdx) return null
        const depth = (i - currentIdx) / (ZONES.length - currentIdx)
        const blur = 3 + depth * 4
        const dark = 0.55 + depth * 0.15
        return (
          <div key={zone.id}
            className="absolute rounded-full pointer-events-none z-10"
            style={{
              left:      `${zone.x}%`,
              top:       `${zone.y}%`,
              width:     '7%',
              height:    '9%',
              transform: 'translate(-50%, -50%)',
              backdropFilter: `blur(${blur}px) brightness(${dark}) saturate(0.5)`,
              WebkitBackdropFilter: `blur(${blur}px) brightness(${dark}) saturate(0.5)`,
              background: `radial-gradient(ellipse, rgba(5,10,5,0.15) 0%, transparent 70%)`,
            }}
          />
        )
      })}

      {/* Subtle edge vignette */}
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.25) 100%)' }}
      />

      {/* Trail connecting zones */}
      <Trail zones={ZONES} currentIdx={currentIdx} />

      {/* Zone markers */}
      {ZONES.map((zone, i) => {
        const isUnlocked = i <= currentIdx
        const isCurrent  = i === currentIdx
        const isSelected = selected?.id === zone.id

        return (
          <div key={zone.id}
            className="absolute z-20 flex flex-col items-center cursor-pointer"
            style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={e => { e.stopPropagation(); setSelected(isSelected ? null : zone) }}>

            {/* Pulse ring on current zone */}
            {isCurrent && (
              <div className="absolute rounded-full animate-ping"
                style={{
                  width: '56px', height: '56px',
                  background: 'rgba(245,158,11,0.3)',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animationDuration: '1.5s',
                }}
              />
            )}

            {/* Zone circle */}
            <div className="relative flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
              style={{
                width:  isCurrent ? '54px' : '40px',
                height: isCurrent ? '54px' : '40px',
                background: isCurrent
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : isUnlocked
                    ? 'rgba(255,255,255,0.88)'
                    : 'rgba(20,20,20,0.65)',
                border: isCurrent
                  ? '3px solid #fcd34d'
                  : isUnlocked
                    ? '2px solid rgba(255,255,255,0.9)'
                    : '2px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: isCurrent
                  ? '0 0 28px rgba(245,158,11,0.75), 0 6px 16px rgba(0,0,0,0.5)'
                  : isUnlocked
                    ? '0 4px 14px rgba(0,0,0,0.35)'
                    : '0 2px 8px rgba(0,0,0,0.5)',
                fontSize: isCurrent ? '26px' : '18px',
                filter: isUnlocked ? 'none' : 'grayscale(0.8) brightness(0.55)',
                transition: 'all 0.2s ease',
              }}>
              {isUnlocked ? zone.emoji : '🔒'}
            </div>

            {/* "YOU ARE HERE" badge above current */}
            {isCurrent && (
              <div className="absolute px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  top: '-28px', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(245,158,11,0.5)',
                }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#fcd34d', letterSpacing: '0.12em' }}>
                  DAY {dayCount} — YOU ARE HERE
                </p>
              </div>
            )}

            {/* Zone name label */}
            <div className="mt-1.5 px-2.5 py-1 rounded-xl whitespace-nowrap"
              style={{
                background: isCurrent ? 'rgba(245,158,11,0.92)' : 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: isCurrent
                  ? '1px solid rgba(252,211,77,0.6)'
                  : '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
              }}>
              <p style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: isCurrent ? '#1c1917' : isUnlocked ? '#fff' : 'rgba(255,255,255,0.35)',
              }}>
                {isUnlocked ? zone.name : `Day ${zone.day}`}
              </p>
            </div>
          </div>
        )
      })}

      {/* Zone popup card */}
      {selected && (() => {
        const isUnlocked = dayCount >= selected.day
        const pct = Math.min(100, (dayCount / Math.max(selected.day, 1)) * 100)
        return (
          <div className="absolute z-40"
            style={{
              left: `${Math.min(selected.x + 6, 70)}%`,
              top:  `${Math.max(selected.y - 16, 3)}%`,
            }}
            onClick={e => e.stopPropagation()}>
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8,12,8,0.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
                minWidth: '200px',
                maxWidth: '230px',
              }}>
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: '32px' }}>{selected.emoji}</span>
                  <div>
                    <p className="font-black text-sm text-white leading-tight">{selected.name}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(245,158,11,0.85)', fontWeight: 600 }}>
                      Unlocks at Day {selected.day}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                  {selected.desc}
                </p>
                {isUnlocked ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>Unlocked</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex justify-between mb-1">
                      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>Progress</p>
                      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>
                        {selected.day - dayCount} days left
                      </p>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Bottom-left legend */}
      <div className="absolute bottom-5 left-5 z-30"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '10px 14px',
        }}>
        {[
          { dot: '#f59e0b',               label: 'Current zone' },
          { dot: 'rgba(255,255,255,0.85)', label: 'Unlocked'     },
          { dot: 'rgba(80,80,80,0.7)',     label: 'Locked'        },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

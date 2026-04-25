import { useMemo, useState } from 'react'

// All coordinates in this viewBox — SVG scales to fill any container perfectly
const VW = 1400
const VH = 820

export const ZONES = [
  { days: 0,   name: 'Day Zero',        icon: '🌱', px: 130,  py: 740, bg: '#bbf7d0', stroke: '#16a34a', tc: '#14532d', terrain: 'Grasslands',    desc: 'You chose to begin. That alone takes more courage than most people know.' },
  { days: 1,   name: 'First Breath',    icon: '🌬️', px: 310,  py: 678, bg: '#ccfbf1', stroke: '#0d9488', tc: '#0f766e', terrain: 'Forest Edge',   desc: 'One full day. The urge came and you outlasted it.' },
  { days: 3,   name: 'The Clearing',    icon: '🏕️', px: 510,  py: 705, bg: '#d1fae5', stroke: '#059669', tc: '#065f46', terrain: 'Pine Forest',   desc: 'Three days. Your brain is already rewiring itself.' },
  { days: 7,   name: 'Summit Ridge',    icon: '⛰️', px: 715,  py: 598, bg: '#fed7aa', stroke: '#ea580c', tc: '#7c2d12', terrain: 'Highland',      desc: 'One week. You stand where most people never reach.' },
  { days: 14,  name: 'Crystal Lake',    icon: '🏞️', px: 898,  py: 462, bg: '#bae6fd', stroke: '#0284c7', tc: '#0c4a6e', terrain: 'Crystal Lake',  desc: 'Two weeks. The cravings are shorter now. You can feel it.' },
  { days: 21,  name: 'Valley of Bloom', icon: '🌸', px: 1048, py: 315, bg: '#fce7f3', stroke: '#db2777', tc: '#831843', terrain: 'Flower Valley', desc: 'Three weeks. A new habit is taking root.' },
  { days: 30,  name: 'The Summit',      icon: '🏔️', px: 858,  py: 175, bg: '#e2e8f0', stroke: '#475569', tc: '#1e293b', terrain: 'Snowcap Peak',  desc: 'One month. You are genuinely different than when you started.' },
  { days: 60,  name: 'The Horizon',     icon: '🌅', px: 618,  py: 95,  bg: '#fef3c7', stroke: '#d97706', tc: '#78350f', terrain: 'Golden Shore',  desc: 'Sixty days. The old version of you is far behind.' },
  { days: 100, name: 'The Kingdom',     icon: '👑', px: 345,  py: 55,  bg: '#f3e8ff', stroke: '#7c3aed', tc: '#581c87', terrain: 'Ancient Capital',desc: 'One hundred days. You have built a new identity.' },
]

function crPath(pts) {
  if (pts.length < 2) return ''
  const d = [`M ${pts[0].x} ${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cx1 = (p1.x + (p2.x - p0.x) / 5).toFixed(1)
    const cy1 = (p1.y + (p2.y - p0.y) / 5).toFixed(1)
    const cx2 = (p2.x - (p3.x - p1.x) / 5).toFixed(1)
    const cy2 = (p2.y - (p3.y - p1.y) / 5).toFixed(1)
    d.push(`C ${cx1} ${cy1} ${cx2} ${cy2} ${p2.x} ${p2.y}`)
  }
  return d.join(' ')
}

// Tree SVG group at position
function T({ x, y, r = 16 }) {
  return (
    <g>
      <rect x={x - 3} y={y} width={6} height={r * 0.55} fill="#5a3010" rx="2"/>
      <circle cx={x} cy={y - r * 0.3} r={r}      fill="#245a0a"/>
      <circle cx={x} cy={y - r * 0.52} r={r * 0.72} fill="#2e7210"/>
      <ellipse cx={x - r*0.15} cy={y - r*0.65} rx={r*0.52} ry={r*0.35} fill="#3a8e18" opacity="0.7"/>
    </g>
  )
}

// Rock cluster
function Rock({ x, y }) {
  return (
    <g>
      <ellipse cx={x}    cy={y}    rx={12} ry={8}  fill="#8a7060"/>
      <ellipse cx={x+10} cy={y+3}  rx={9}  ry={6}  fill="#9a8070"/>
      <ellipse cx={x-8}  cy={y+4}  rx={7}  ry={5}  fill="#7a6050"/>
    </g>
  )
}

const TREES = [
  // Grassland (around zone 0)
  [70,720,15],[55,690,17],[95,658,14],[185,755,14],[195,710,13],
  // Forest zone 1-2 area
  [230,680,18],[255,658,16],[250,715,17],
  [370,660,19],[395,645,16],[418,665,18],[442,648,15],[465,665,17],[488,648,16],
  [535,665,18],[558,648,15],[578,665,17],[602,648,16],[628,665,17],[648,648,14],
  // Highland (zone 3 sparse)
  [652,625,16],[675,608,14],[695,630,14],
  // Right center (zone 4 area)
  [812,500,17],[838,480,15],[858,502,16],
  [932,488,15],[952,468,17],[968,490,14],
  // Upper right (zone 5)
  [982,355,16],[1005,340,15],[1022,358,17],
  [1068,342,15],[1090,328,16],[1108,345,14],
  // Upper center (zone 7-8)
  [465,178,15],[492,158,17],[515,175,14],
  [568,152,16],[590,135,15],
  [680,158,15],[702,142,16],[722,160,14],
  // Mid-right
  [755,478,17],[772,458,15],[792,476,16],
  // Scattered
  [295,762,14],[318,748,16],[340,764,13],
  [402,728,15],[422,718,17],[442,730,14],
  [852,375,15],[872,358,16],[892,375,14],
  [802,275,16],[822,258,15],[842,275,14],
  [1100,440,15],[1118,420,14],[1135,438,16],
]

const ROCKS = [
  [590,390],[620,415],[750,310],[780,330],[1060,250],[920,200],[280,620],[180,580],
]

export default function RecoveryMap({ dayCount, onZoneClick }) {
  const [selected, setSelected] = useState(null)
  const pts = ZONES.map(z => ({ x: z.px, y: z.py }))

  const currentIdx = useMemo(
    () => ZONES.reduce((best, z, i) => (dayCount >= z.days ? i : best), 0),
    [dayCount]
  )

  const pathAll      = useMemo(() => crPath(pts), [])
  const pathUnlocked = useMemo(() => crPath(pts.slice(0, currentIdx + 1)), [currentIdx])
  const pathLocked   = useMemo(() => crPath(pts.slice(currentIdx)), [currentIdx])

  const handleClick = (i) => {
    setSelected(i === selected ? null : i)
    onZoneClick?.(i)
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      <svg
        width="100%" height="100%"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          {ZONES.map((z, i) => (
            <radialGradient key={i} id={`fog${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="10%" stopColor="#061006" stopOpacity="0.88"/>
              <stop offset="100%" stopColor="#061006" stopOpacity="0"/>
            </radialGradient>
          ))}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* ── BASE TERRAIN ── */}
        <rect width={VW} height={VH} fill="#4e9820"/>

        {/* Ground variation — lighter hill patches */}
        <ellipse cx="700"  cy="580" rx="720" ry="380" fill="#62b030" opacity="0.55"/>
        <ellipse cx="380"  cy="700" rx="420" ry="210" fill="#70c038" opacity="0.45"/>
        <ellipse cx="1050" cy="430" rx="380" ry="300" fill="#68b828" opacity="0.42"/>
        <ellipse cx="620"  cy="200" rx="540" ry="260" fill="#58a820" opacity="0.38"/>
        <ellipse cx="200"  cy="300" rx="260" ry="180" fill="#52a018" opacity="0.35"/>

        {/* Darker forest floor under tree clusters */}
        <ellipse cx="460"  cy="685" rx="200" ry="85"  fill="#2a5a0c" opacity="0.45"/>
        <ellipse cx="620"  cy="665" rx="175" ry="78"  fill="#2a5a0c" opacity="0.40"/>
        <ellipse cx="900"  cy="490" rx="130" ry="70"  fill="#3a6a18" opacity="0.35"/>

        {/* ── LEFT MOUNTAIN RANGE (brown jagged spires) ── */}
        <path d="M 0,820 L 0,510 L 58,368 L 102,448 L 148,292 L 192,378 L 225,248 L 262,335 L 288,285 L 315,348 L 338,315 L 322,418 L 292,498 L 258,595 L 215,705 L 125,795 Z"
          fill="#7a4518"/>
        {/* Shadow face */}
        <path d="M 58,368 L 102,448 L 118,520 L 84,572 L 62,502 Z" fill="#4a2808" opacity="0.65"/>
        <path d="M 148,292 L 192,378 L 208,450 L 172,498 L 150,420 Z" fill="#4a2808" opacity="0.58"/>
        <path d="M 225,248 L 262,335 L 270,408 L 242,382 Z" fill="#4a2808" opacity="0.55"/>
        {/* Highlight face */}
        <path d="M 58,368 L 102,448 L 76,428 Z" fill="#aa6832" opacity="0.45"/>
        <path d="M 148,292 L 192,378 L 170,340 Z" fill="#aa6832" opacity="0.40"/>
        {/* Foreground smaller spires */}
        <path d="M 0,820 L 0,640 L 35,545 L 60,635 Z" fill="#8a5220"/>
        <path d="M 295,820 L 295,655 L 322,578 L 345,625 L 345,820 Z" fill="#6a3812" opacity="0.75"/>

        {/* ── TOP-LEFT SNOW MOUNTAINS ── */}
        <path d="M 0,0 L 0,330 L 70,238 L 112,298 L 162,198 L 212,278 L 265,158 L 318,238 L 372,132 L 422,218 L 468,165 L 512,242 L 488,308 L 425,328 L 345,318 L 245,328 L 128,338 L 0,330 Z"
          fill="#8a7868"/>
        {/* Sun-facing slope highlights */}
        <path d="M 265,158 L 305,205 L 318,238 L 302,220 Z" fill="#aa9878" opacity="0.6"/>
        <path d="M 372,132 L 410,182 L 422,218 L 406,202 Z" fill="#aa9878" opacity="0.6"/>
        {/* Snow caps */}
        <path d="M 265,158 L 320,212 L 318,238 L 308,218 L 292,195 L 278,175 Z" fill="#dde8f4" opacity="0.92"/>
        <path d="M 372,132 L 420,195 L 422,218 L 412,202 L 395,178 L 378,155 Z" fill="#dde8f4" opacity="0.92"/>
        <path d="M 162,198 L 200,232 L 212,278 L 205,258 L 185,232 L 168,212 Z" fill="#ccddf0" opacity="0.82"/>
        {/* Glacier/ice */}
        <ellipse cx="215" cy="298" rx="85" ry="28" fill="#b0d8f0" opacity="0.52"/>
        <ellipse cx="362" cy="258" rx="75" ry="22" fill="#c0e0f8" opacity="0.48"/>

        {/* ── RIGHT MOUNTAIN RANGE ── */}
        <path d="M 1400,820 L 1400,308 L 1372,432 L 1348,352 L 1315,448 L 1290,328 L 1258,442 L 1232,358 L 1205,458 L 1178,378 L 1150,482 L 1122,605 L 1098,722 L 1072,820 Z"
          fill="#8a5820"/>
        <path d="M 1290,328 L 1315,448 L 1295,488 L 1262,442 Z" fill="#5a3010" opacity="0.58"/>
        <path d="M 1348,352 L 1372,432 L 1358,478 L 1325,448 Z" fill="#5a3010" opacity="0.52"/>
        <path d="M 1205,0 L 1400,0 L 1400,308 L 1372,432 L 1348,182 L 1308,268 L 1275,162 L 1238,248 L 1205,198 Z"
          fill="#9a8878"/>
        <path d="M 1245,162 L 1285,222 L 1308,182 L 1295,202 L 1278,218 L 1260,192 L 1248,172 Z" fill="#dde8f4" opacity="0.72"/>

        {/* ── RIVER ── */}
        {/* River banks (wide dark) */}
        <path d="M 698,0 C 688,55 718,108 708,162 C 698,218 750,265 740,318 C 730,370 808,402 798,455 C 788,508 862,542 852,598 C 842,655 895,705 885,762 C 875,802 895,810 895,820"
          fill="none" stroke="#18628a" strokeWidth="44" strokeLinecap="round"/>
        {/* River mid */}
        <path d="M 698,0 C 688,55 718,108 708,162 C 698,218 750,265 740,318 C 730,370 808,402 798,455 C 788,508 862,542 852,598 C 842,655 895,705 885,762 C 875,802 895,810 895,820"
          fill="none" stroke="#2a9ac0" strokeWidth="30" strokeLinecap="round"/>
        {/* River highlight */}
        <path d="M 698,0 C 688,55 718,108 708,162 C 698,218 750,265 740,318 C 730,370 808,402 798,455 C 788,508 862,542 852,598 C 842,655 895,705 885,762 C 875,802 895,810 895,820"
          fill="none" stroke="#60d0f0" strokeWidth="12" strokeLinecap="round" opacity="0.42"/>
        {/* Ripple details */}
        <path d="M 698,0 C 688,55 718,108 708,162 C 698,218 750,265 740,318 C 730,370 808,402 798,455 C 788,508 862,542 852,598 C 842,655 895,705 885,762 C 875,802 895,810 895,820"
          fill="none" stroke="#3a9820" strokeWidth="55" strokeLinecap="round" opacity="0.18"/>

        {/* ── ROCKS ── */}
        {ROCKS.map(([x, y], i) => <Rock key={i} x={x} y={y}/>)}

        {/* ── TREES ── */}
        {TREES.map(([x, y, r], i) => <T key={i} x={x} y={y} r={r}/>)}

        {/* ── ZONE SANDY CLEARINGS ── */}
        {ZONES.map((z, i) => {
          const unlocked = dayCount >= z.days
          return (
            <g key={z.days}>
              <circle cx={z.px} cy={z.py} r={52} fill="#a88840" opacity={unlocked ? 0.68 : 0.28}/>
              <circle cx={z.px} cy={z.py} r={40} fill="#c8a858" opacity={unlocked ? 0.82 : 0.32}/>
            </g>
          )
        })}

        {/* ── TRAIL ── */}
        {/* Road shadow */}
        <path d={pathAll} fill="none" stroke="#3a1a00" strokeWidth="14"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.22"/>
        {/* Locked trail */}
        {pts.slice(currentIdx).length > 1 && (
          <path d={pathLocked} fill="none" stroke="#8a8878" strokeWidth="5"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16 10" opacity="0.6"/>
        )}
        {/* Unlocked trail */}
        {pts.slice(0, currentIdx + 1).length > 1 && <>
          <path d={pathUnlocked} fill="none" stroke="#b06800" strokeWidth="9"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
          <path d={pathUnlocked} fill="none" stroke="#f8c040" strokeWidth="4.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </>}

        {/* ── FOG OF WAR ── */}
        {ZONES.map((z, i) => {
          if (dayCount >= z.days) return null
          return <ellipse key={z.days} cx={z.px} cy={z.py} rx="115" ry="108" fill={`url(#fog${i})`}/>
        })}

        {/* ── ZONE MARKERS (all SVG — aligns perfectly with slice scaling) ── */}
        {ZONES.map((z, i) => {
          const unlocked = dayCount >= z.days
          const isCurrent = i === currentIdx
          const isSelected = i === selected
          const r = isCurrent ? 28 : 22
          const daysAway = z.days - dayCount

          return (
            <g key={z.days} transform={`translate(${z.px},${z.py})`}
               onClick={() => handleClick(i)} style={{ cursor: 'pointer' }}>

              {/* Pulsing ring for current */}
              {isCurrent && (
                <circle r={38} fill="none" stroke="#f8c040" strokeWidth="3"
                  strokeDasharray="10 6" opacity="0.9" filter="url(#glow)"/>
              )}

              {/* Selection ring */}
              {isSelected && !isCurrent && (
                <circle r={32} fill="none" stroke="white" strokeWidth="2.5" opacity="0.8"/>
              )}

              {/* Zone circle */}
              <circle r={r} fill={unlocked ? z.bg : '#b8c8b0'} stroke="white" strokeWidth={isCurrent ? 3 : 2}
                opacity={unlocked ? 1 : 0.45} filter="url(#shadow)"/>

              {/* Icon emoji */}
              <text textAnchor="middle" dominantBaseline="middle"
                fontSize={isCurrent ? 22 : 17}
                style={{ userSelect: 'none', filter: unlocked ? 'none' : 'grayscale(1) opacity(0.5)' }}>
                {unlocked ? z.icon : '🔒'}
              </text>

              {/* Name label pill */}
              <rect x={-46} y={r + 4} width={92} height={18} rx={5}
                fill={unlocked ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.35)'}/>
              <text textAnchor="middle" y={r + 17} fontSize="10" fontWeight="bold"
                fill={unlocked ? 'white' : '#ccc'} style={{ userSelect: 'none' }}>
                {z.name}
              </text>

              {/* Days away (only when close) */}
              {!unlocked && daysAway > 0 && daysAway <= 14 && (
                <>
                  <rect x={-22} y={r + 25} width={44} height={14} rx={4} fill="rgba(0,0,0,0.5)"/>
                  <text textAnchor="middle" y={r + 35} fontSize="9" fill="#ddd" style={{ userSelect: 'none' }}>
                    {daysAway} days
                  </text>
                </>
              )}

              {/* "You are here" pin */}
              {isCurrent && (
                <>
                  <text textAnchor="middle" y={-r - 14} fontSize="16" style={{ userSelect: 'none' }}>📍</text>
                  <rect x={-30} y={-r - 38} width={60} height={16} rx={5} fill="#f8c040"/>
                  <text textAnchor="middle" y={-r - 26} fontSize="9" fontWeight="black"
                    fill="#1a0a00" style={{ userSelect: 'none' }}>
                    DAY {dayCount}
                  </text>
                </>
              )}

              {/* Info popup on selected */}
              {isSelected && (
                <g transform={`translate(0, ${-r - 55})`}>
                  <rect x={-80} y={-26} width={160} height={52} rx={8} fill="rgba(0,0,0,0.82)"/>
                  <text textAnchor="middle" y={-10} fontSize="10" fontWeight="bold" fill="white"
                    style={{ userSelect: 'none' }}>{z.terrain}</text>
                  <text textAnchor="middle" y={5} fontSize="8.5" fill="#ddd"
                    style={{ userSelect: 'none' }}>Day {z.days}</text>
                  {unlocked ? (
                    <text textAnchor="middle" y={18} fontSize="7.5" fill="#a0e0a0"
                      style={{ userSelect: 'none' }}>✓ Unlocked</text>
                  ) : (
                    <text textAnchor="middle" y={18} fontSize="7.5" fill="#f8c040"
                      style={{ userSelect: 'none' }}>{z.days - dayCount} days away</text>
                  )}
                </g>
              )}
            </g>
          )
        })}

        {/* Map border frame */}
        <rect x="14" y="14" width={VW - 28} height={VH - 28} fill="none"
          stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" rx="8"/>

        {/* Compass rose */}
        <g transform={`translate(${VW - 50}, ${VH - 50})`} opacity="0.6">
          <circle r="18" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <text textAnchor="middle" y="-8"  fontSize="8" fill="white" fontFamily="serif">N</text>
          <text textAnchor="middle" y="14"  fontSize="8" fill="white" fontFamily="serif">S</text>
          <text textAnchor="middle" x="-11" y="3" fontSize="8" fill="white" fontFamily="serif">W</text>
          <text textAnchor="middle" x="11"  y="3" fontSize="8" fill="white" fontFamily="serif">E</text>
          <line x1="0" y1="-13" x2="0" y2="13" stroke="white" strokeWidth="0.8" opacity="0.5"/>
          <line x1="-13" y1="0" x2="13" y2="0" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        </g>
      </svg>
    </div>
  )
}

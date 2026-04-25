import { useEffect, useState } from 'react'

// Leaf particles that float upward
function Leaf({ style }) {
  return (
    <div className="animate-leaf absolute bottom-0 text-2xl select-none pointer-events-none" style={style}>
      🍃
    </div>
  )
}

const LEAVES = [
  { left: '10%',  animationDuration: '8s',  animationDelay: '0s',   fontSize: '14px' },
  { left: '25%',  animationDuration: '11s', animationDelay: '2.5s', fontSize: '10px' },
  { left: '42%',  animationDuration: '9s',  animationDelay: '1s',   fontSize: '18px' },
  { left: '60%',  animationDuration: '12s', animationDelay: '0.5s', fontSize: '12px' },
  { left: '75%',  animationDuration: '7s',  animationDelay: '3s',   fontSize: '16px' },
  { left: '88%',  animationDuration: '10s', animationDelay: '1.8s', fontSize: '11px' },
]

export default function CalmPage({ onContinue }) {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState('inhale') // inhale | exhale

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => p === 'inhale' ? 'exhale' : 'inhale')
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden transition-opacity duration-700"
      style={{
        opacity: visible ? 1 : 0,
        background: 'linear-gradient(to bottom, #b8d4e8 0%, #d4e8c2 45%, #e8f0d8 70%, #4a7c59 70%, #3a6b48 85%, #2d5a38 100%)',
      }}>

      {/* Sky stars / soft clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white/20"
            style={{
              left: `${10 + i * 11}%`, top: `${8 + (i % 3) * 8}%`,
              width: `${60 + (i % 4) * 30}px`, height: `${20 + (i % 3) * 12}px`,
              filter: 'blur(12px)', opacity: 0.5 + (i % 3) * 0.1
            }} />
        ))}
      </div>

      {/* Far mountains — pale blue */}
      <svg className="absolute bottom-[28%] w-full animate-mountain" style={{ animationDelay: '0.1s' }}
        viewBox="0 0 1440 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,220 L0,140 L120,60 L240,120 L360,40 L480,110 L600,30 L720,100 L840,20 L960,90 L1080,35 L1200,95 L1320,50 L1440,80 L1440,220 Z"
          fill="#8fb8d4" fillOpacity="0.6" />
      </svg>

      {/* Mid mountains — sage green */}
      <svg className="absolute bottom-[28%] w-full animate-mountain" style={{ animationDelay: '0.3s' }}
        viewBox="0 0 1440 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,180 L0,120 L100,70 L200,110 L320,50 L440,100 L560,55 L680,90 L800,45 L920,85 L1040,40 L1160,80 L1280,55 L1440,75 L1440,180 Z"
          fill="#6b9e7a" fillOpacity="0.7" />
      </svg>

      {/* Close mountains — dark forest green */}
      <svg className="absolute bottom-[28%] w-full animate-mountain" style={{ animationDelay: '0.5s' }}
        viewBox="0 0 1440 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,150 L0,90 L80,50 L160,85 L260,30 L360,75 L460,40 L560,70 L660,25 L760,65 L860,35 L960,60 L1060,20 L1160,55 L1280,30 L1440,50 L1440,150 Z"
          fill="#4a7c59" />
      </svg>

      {/* Tree line silhouette */}
      <div className="absolute bottom-[26%] w-full flex items-end justify-around px-4 animate-mountain" style={{ animationDelay: '0.7s' }}>
        {[...Array(24)].map((_, i) => {
          const h = 40 + (i % 5) * 18
          const w = 18 + (i % 3) * 8
          return (
            <div key={i} className="flex flex-col items-center" style={{ opacity: 0.85 + (i % 3) * 0.05 }}>
              {/* Tree triangle */}
              <div style={{
                width: 0, height: 0,
                borderLeft: `${w / 2}px solid transparent`,
                borderRight: `${w / 2}px solid transparent`,
                borderBottom: `${h}px solid #2d5a38`
              }} />
              {/* Trunk */}
              <div style={{ width: '4px', height: '10px', background: '#1e3d26' }} />
            </div>
          )
        })}
      </div>

      {/* Ground strip */}
      <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-b from-[#3a6b48] to-[#1e3d26]" />

      {/* Floating leaves */}
      {LEAVES.map((style, i) => <Leaf key={i} style={style} />)}

      {/* Content card */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 mt-[-8%]">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-stone-900/20 border border-white/60 animate-slide-up">

          {/* Breathing circle */}
          <div className="flex items-center justify-center mb-6">
            <div
              className="animate-breathe rounded-full flex items-center justify-center"
              style={{
                width: '80px', height: '80px',
                background: 'radial-gradient(circle, #d4f0dc 0%, #a8d8b4 100%)',
                boxShadow: '0 0 0 12px rgba(168, 216, 180, 0.2)',
              }}>
              <span className="text-3xl">🌿</span>
            </div>
          </div>

          <h1 className="text-2xl font-black text-stone-800 mb-2">I'm here for you.</h1>
          <p className="text-stone-500 text-sm leading-relaxed mb-2">
            You reached out. That's the bravest thing.
          </p>
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest mb-6">
            {phase === 'inhale' ? '↑ Breathe in slowly' : '↓ Let it out'}
          </p>

          <button
            onClick={onContinue}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all text-sm shadow-lg shadow-emerald-500/30">
            I'm ready — let's do this
          </button>
          <p className="text-stone-400 text-xs mt-3">7 minutes. That's all we need.</p>
        </div>
      </div>
    </div>
  )
}

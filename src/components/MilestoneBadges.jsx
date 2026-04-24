import { useEmberStore } from '../store/emberStore'

const MILESTONES = [
  { days: 1,   emoji: '🌱', label: 'First Spark',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { days: 3,   emoji: '🔥', label: '3-Day Flame',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  { days: 7,   emoji: '⚡', label: 'One Week',      color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20'  },
  { days: 14,  emoji: '🌙', label: 'Two Weeks',     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'      },
  { days: 30,  emoji: '💎', label: 'One Month',     color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20'      },
  { days: 100, emoji: '👑', label: '100 Days',      color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20'  },
]

export default function MilestoneBadges() {
  const { dayCount } = useEmberStore()
  const next = MILESTONES.find(m => dayCount < m.days)

  return (
    <div className="bg-stone-900 border border-white/5 rounded-2xl p-6">
      <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-5">Milestones</p>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {MILESTONES.map(m => {
          const earned = dayCount >= m.days
          return (
            <div key={m.days}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all
                ${earned ? `${m.bg} border` : 'bg-stone-800/40 border-transparent opacity-40 grayscale'}`}>
              <span className="text-2xl">{m.emoji}</span>
              <p className={`text-xs font-semibold text-center leading-tight ${earned ? m.color : 'text-stone-500'}`}>
                {m.label}
              </p>
              <p className="text-stone-600 text-xs">Day {m.days}</p>
            </div>
          )
        })}
      </div>

      {next && (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-stone-400">Next: {next.emoji} {next.label}</span>
            <span className="text-stone-500">{dayCount}/{next.days} days</span>
          </div>
          <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((dayCount / next.days) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

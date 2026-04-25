import { useEmberStore } from '../store/emberStore'

const MILESTONES = [
  { days: 1,   emoji: '🌱', label: 'First Spark',  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { days: 3,   emoji: '🔥', label: '3-Day Flame',  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'     },
  { days: 7,   emoji: '⚡', label: 'One Week',      color: 'text-yellow-600',  bg: 'bg-yellow-50 border-yellow-200'   },
  { days: 14,  emoji: '🌙', label: 'Two Weeks',     color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200'       },
  { days: 30,  emoji: '💎', label: 'One Month',     color: 'text-cyan-600',    bg: 'bg-cyan-50 border-cyan-200'       },
  { days: 100, emoji: '👑', label: '100 Days',      color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200'   },
]

export default function MilestoneBadges() {
  const { dayCount } = useEmberStore()
  const next = MILESTONES.find(m => dayCount < m.days)

  return (
    <div>
      <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-5">Milestones</p>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {MILESTONES.map(m => {
          const earned = dayCount >= m.days
          return (
            <div key={m.days}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all
                ${earned ? `${m.bg}` : 'bg-stone-50 border-stone-200 opacity-35 grayscale'}`}>
              <span className="text-2xl">{m.emoji}</span>
              <p className={`text-xs font-bold text-center leading-tight ${earned ? m.color : 'text-stone-500'}`}>
                {m.label}
              </p>
              <p className="text-stone-500 text-xs">Day {m.days}</p>
            </div>
          )
        })}
      </div>

      {next && (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-stone-500">Next: {next.emoji} {next.label}</span>
            <span className="text-stone-400">{dayCount}/{next.days} days</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((dayCount / next.days) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

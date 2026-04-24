import { useEmberStore } from '../store/emberStore'

const MILESTONES = [
  { days: 1,   emoji: '🌱', label: 'First Spark',   color: 'text-emerald-400' },
  { days: 3,   emoji: '🔥', label: '3-Day Flame',   color: 'text-amber-400'   },
  { days: 7,   emoji: '⚡', label: 'One Week',       color: 'text-yellow-400'  },
  { days: 14,  emoji: '🌙', label: 'Two Weeks',      color: 'text-blue-400'    },
  { days: 30,  emoji: '💎', label: 'One Month',      color: 'text-cyan-400'    },
  { days: 100, emoji: '👑', label: '100 Days',       color: 'text-purple-400'  },
]

export default function MilestoneBadges() {
  const { dayCount } = useEmberStore()

  const earned = MILESTONES.filter(m => dayCount >= m.days)
  const next = MILESTONES.find(m => dayCount < m.days)

  if (earned.length === 0 && !next) return null

  return (
    <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800">
      <p className="text-stone-400 text-xs uppercase tracking-widest mb-4">Milestones</p>

      {earned.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {earned.map(m => (
            <div key={m.days} className="flex items-center gap-2 bg-stone-800 rounded-xl px-3 py-2">
              <span className="text-xl">{m.emoji}</span>
              <div>
                <p className={`text-xs font-semibold ${m.color}`}>{m.label}</p>
                <p className="text-stone-500 text-xs">Day {m.days}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {next && (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-stone-500 mb-1.5">
            <span>Next: {next.emoji} {next.label}</span>
            <span>{dayCount} / {next.days} days</span>
          </div>
          <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${Math.min((dayCount / next.days) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

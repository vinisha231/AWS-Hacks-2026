import { useEffect, useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

export default function QuickStats() {
  const { user, dayCount, sparkProfile } = useEmberStore()
  const [stats, setStats] = useState({ survived: 0, total: 0, longestStreak: 0, topSpark: null })

  useEffect(() => {
    if (!user?.id) return
    getCravingHistory(user.id, 100).then(history => {
      const survived = history.filter(e => e.survived).length
      const total = history.length

      let longest = 0, current = 0
      ;[...history].reverse().forEach(e => {
        if (e.survived) { current++; longest = Math.max(longest, current) }
        else current = 0
      })

      const topSpark = Object.entries(sparkProfile).sort(([,a],[,b]) => b-a)[0]?.[0]
      setStats({ survived, total, longestStreak: longest, topSpark })
    })
  }, [user, sparkProfile])

  const winRate = stats.total > 0 ? Math.round((stats.survived / stats.total) * 100) : 0

  const cards = [
    { value: dayCount, label: 'Day streak', color: 'text-amber-400', emoji: '🔥' },
    { value: `${winRate}%`, label: 'Win rate', color: 'text-emerald-400', emoji: '⚡' },
    { value: stats.survived, label: 'Survived', color: 'text-blue-400', emoji: '✊' },
    { value: stats.longestStreak, label: 'Best streak', color: 'text-purple-400', emoji: '👑' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ value, label, color, emoji }) => (
        <div key={label} className="bg-stone-900 rounded-2xl p-4 border border-stone-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg">{emoji}</span>
          </div>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <p className="text-stone-500 text-xs mt-0.5">{label}</p>
        </div>
      ))}
      {stats.topSpark && (
        <div className="col-span-2 bg-stone-900 rounded-2xl p-4 border border-stone-800 flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-wider">Your spark identity</p>
            <p className="text-white font-semibold capitalize mt-0.5">{stats.topSpark} explorer</p>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

export default function StreakCalendar() {
  const { user } = useEmberStore()
  const [days, setDays] = useState([])

  useEffect(() => {
    if (!user?.id) return
    getCravingHistory(user.id, 100).then(history => {
      const today = new Date()
      const grid = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (27 - i))
        const dateStr = d.toISOString().split('T')[0]
        const events = history.filter(e =>
          e.triggered_at?.startsWith(dateStr)
        )
        const hasSurvived = events.some(e => e.survived)
        const hasRelapsed = events.some(e => !e.survived)
        return {
          date: d,
          label: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()],
          day: d.getDate(),
          status: hasSurvived ? 'survived' : hasRelapsed ? 'relapsed' : 'empty',
          isToday: dateStr === today.toISOString().split('T')[0],
        }
      })
      setDays(grid)
    })
  }, [user])

  const colorMap = {
    survived: 'bg-amber-500',
    relapsed: 'bg-stone-700',
    empty: 'bg-stone-800/60',
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  return (
    <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800">
      <p className="text-stone-400 text-xs uppercase tracking-widest mb-4">Last 28 days</p>
      <div className="flex flex-col gap-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((d, di) => (
              <div key={di} className="flex flex-col items-center gap-1">
                {wi === 0 && (
                  <span className="text-stone-600 text-xs">{d.label}</span>
                )}
                <div
                  className={`w-full aspect-square rounded-md ${colorMap[d.status]} ${
                    d.isToday ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-stone-900' : ''
                  }`}
                  title={`${d.date.toDateString()} — ${d.status}`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500" /><span className="text-stone-500 text-xs">Survived</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-stone-700" /><span className="text-stone-500 text-xs">Reset</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-stone-800" /><span className="text-stone-500 text-xs">Quiet day</span></div>
      </div>
    </div>
  )
}

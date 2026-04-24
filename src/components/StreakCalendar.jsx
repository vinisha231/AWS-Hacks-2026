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
        const events = history.filter(e => e.triggered_at?.startsWith(dateStr))
        return {
          date: d,
          label: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()],
          status: events.some(e => e.survived) ? 'survived'
                : events.some(e => !e.survived) ? 'relapsed' : 'empty',
          isToday: dateStr === today.toISOString().split('T')[0],
        }
      })
      setDays(grid)
    })
  }, [user])

  const weeks = Array.from({ length: 4 }, (_, i) => days.slice(i * 7, i * 7 + 7))

  return (
    <div className="bg-stone-900 border border-white/5 rounded-2xl p-6">
      <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-5">28-day heatmap</p>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(l => (
            <p key={l} className="text-center text-stone-600 text-xs">{l}</p>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((d, di) => (
              <div key={di}
                title={`${d.date.toDateString()} — ${d.status}`}
                className={`aspect-square rounded-md transition-all ${
                  d.status === 'survived' ? 'bg-amber-500' :
                  d.status === 'relapsed' ? 'bg-stone-700' : 'bg-stone-800'
                } ${d.isToday ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-stone-900' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4">
        {[['bg-amber-500','Survived'],['bg-stone-700','Reset'],['bg-stone-800','Quiet']].map(([cls,label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${cls}`} />
            <span className="text-stone-600 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

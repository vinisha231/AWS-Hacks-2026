import { useEffect, useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

export default function StreakCalendar() {
  const { user, loginDays } = useEmberStore()
  const [days, setDays] = useState([])

  useEffect(() => {
    const today = new Date()
    const buildGrid = (history = []) => {
      return Array.from({ length: 28 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (27 - i))
        const dateStr = d.toISOString().split('T')[0]
        const events = history.filter(e => e.triggered_at?.startsWith(dateStr))
        const wasLoggedIn = loginDays.includes(dateStr)
        return {
          date: d,
          dateStr,
          status: events.some(e => e.survived) ? 'survived'
                : events.some(e => !e.survived) ? 'relapsed'
                : wasLoggedIn ? 'login'
                : 'empty',
          isToday: dateStr === today.toISOString().split('T')[0],
        }
      })
    }

    if (user?.id) {
      getCravingHistory(user.id, 100).then(history => setDays(buildGrid(history)))
    } else {
      setDays(buildGrid([]))
    }
  }, [user, loginDays])

  const weeks = Array.from({ length: 4 }, (_, i) => days.slice(i * 7, i * 7 + 7))

  const cellColor = (status) => {
    if (status === 'survived') return 'bg-amber-400'
    if (status === 'relapsed') return 'bg-red-400/60'
    if (status === 'login')    return 'bg-sky-300/70'
    return 'bg-stone-200'
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
      <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-5">28-day log</p>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(l => (
            <p key={l} className="text-center text-stone-400 text-xs">{l}</p>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((d, di) => (
              <div key={di}
                title={`${d.date.toDateString()} — ${d.status}`}
                className={`aspect-square rounded-md transition-all ${cellColor(d.status)}
                  ${d.isToday ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-white' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
        {[
          ['bg-amber-400',    'Session survived'],
          ['bg-sky-300/70',   'Logged in'],
          ['bg-red-400/60',   'Relapsed'],
          ['bg-stone-200',    'No activity'],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${cls}`} />
            <span className="text-stone-400 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

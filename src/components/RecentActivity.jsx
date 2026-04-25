import { useEffect, useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

export default function RecentActivity() {
  const { user } = useEmberStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    getCravingHistory(user.id, 20).then(data => {
      setHistory(data)
      setLoading(false)
    })
  }, [user])

  return (
    <div>
      <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-5">Recent Activity</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-14 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3 opacity-40">🌱</div>
          <p className="text-stone-700 font-semibold mb-1">No activity yet</p>
          <p className="text-stone-400 text-sm max-w-xs">
            When you hit the craving button, each session gets logged here. Your journey starts with one moment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-stone-100">
          {history.map((event, i) => {
            const date = new Date(event.triggered_at)
            const isToday = new Date().toDateString() === date.toDateString()
            const label = isToday
              ? `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

            return (
              <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base
                  ${event.survived ? 'bg-emerald-50 border border-emerald-200' : 'bg-stone-100 border border-stone-200'}`}>
                  {event.survived ? '🔥' : '🌱'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-stone-900 text-sm font-semibold">
                    {event.survived ? 'Craving survived' : 'Needed a reset'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.spark_used && (
                      <span className="text-amber-500 text-xs">✦ {event.spark_used}</span>
                    )}
                    {event.spark_used && event.hormone_targeted && (
                      <span className="text-stone-300 text-xs">·</span>
                    )}
                    {event.hormone_targeted && (
                      <span className="text-stone-400 text-xs capitalize">{event.hormone_targeted}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-stone-400 text-xs">{label}</p>
                  {event.duration_secs && (
                    <p className="text-stone-300 text-xs mt-0.5">{Math.round(event.duration_secs / 60)}m</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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

  if (loading) return (
    <Section title="Recent Activity">
      <div className="flex flex-col gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-stone-800/40 rounded-xl animate-pulse" />
        ))}
      </div>
    </Section>
  )

  if (history.length === 0) return (
    <Section title="Recent Activity">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🌱</div>
        <p className="text-white font-semibold text-lg mb-1">No activity yet</p>
        <p className="text-stone-500 text-sm max-w-xs">
          When you hit the craving button, each session gets logged here. Your journey starts with one moment.
        </p>
      </div>
    </Section>
  )

  return (
    <Section title="Recent Activity">
      <div className="flex flex-col divide-y divide-white/5">
        {history.map((event, i) => {
          const date = new Date(event.triggered_at)
          const isToday = new Date().toDateString() === date.toDateString()
          const label = isToday ? `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

          return (
            <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg
                ${event.survived ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-stone-800 border border-stone-700'}`}>
                {event.survived ? '🔥' : '🌱'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  {event.survived ? 'Craving survived' : 'Needed a reset'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {event.spark_used && (
                    <span className="text-amber-500 text-xs">✦ {event.spark_used}</span>
                  )}
                  {event.spark_used && event.hormone_targeted && (
                    <span className="text-stone-700 text-xs">·</span>
                  )}
                  {event.hormone_targeted && (
                    <span className="text-stone-500 text-xs capitalize">{event.hormone_targeted}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-stone-500 text-xs">{label}</p>
                {event.duration_secs && (
                  <p className="text-stone-600 text-xs mt-0.5">{Math.round(event.duration_secs / 60)}m</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-stone-900 border border-white/5 rounded-2xl p-6">
      <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-5">{title}</p>
      {children}
    </div>
  )
}

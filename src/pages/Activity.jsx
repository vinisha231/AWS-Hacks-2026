import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

const HORMONE_COLORS = {
  dopamine:   'bg-orange-100 text-orange-600 border-orange-200',
  serotonin:  'bg-blue-100 text-blue-600 border-blue-200',
  oxytocin:   'bg-pink-100 text-pink-600 border-pink-200',
  endorphins: 'bg-purple-100 text-purple-600 border-purple-200',
}

export default function Activity() {
  const { user } = useEmberStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    getCravingHistory(user.id, 50).then(data => {
      setHistory(data)
      setLoading(false)
    })
  }, [user])

  const filtered = filter === 'all' ? history
    : filter === 'survived' ? history.filter(e => e.survived)
    : history.filter(e => !e.survived)

  const survived = history.filter(e => e.survived).length
  const total = history.length
  const winRate = total > 0 ? Math.round((survived / total) * 100) : 0

  return (
    <Layout>
      <div className="px-6 md:px-12 py-10 max-w-2xl mx-auto w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-stone-900 mb-1">Activity</h1>
          <p className="text-stone-400">Every moment you faced a craving, recorded.</p>
        </div>

        {/* Summary strip — inline numbers, no cards */}
        <div className="flex gap-10 mb-8">
          <div>
            <p className="text-4xl font-black text-stone-900">{total}</p>
            <p className="text-stone-400 text-xs mt-0.5">sessions</p>
          </div>
          <div>
            <p className="text-4xl font-black text-emerald-500">{survived}</p>
            <p className="text-stone-400 text-xs mt-0.5">survived</p>
          </div>
          <div>
            <p className="text-4xl font-black text-amber-500">{winRate}%</p>
            <p className="text-stone-400 text-xs mt-0.5">win rate</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'survived', 'reset'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize
                ${filter === f
                  ? 'bg-amber-400 text-black'
                  : 'bg-stone-100 text-stone-500 hover:text-stone-800'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List — borderless on the paper canvas */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 bg-stone-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-stone-700 font-semibold text-lg mb-1">
              {history.length === 0 ? 'No sessions yet' : 'Nothing here yet'}
            </p>
            <p className="text-stone-400 text-sm max-w-sm">
              {history.length === 0
                ? 'Hit the craving button on the Home screen whenever you feel the urge.'
                : `No ${filter} sessions to show.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-stone-100">
            {filtered.map((event, i) => {
              const date = new Date(event.triggered_at)
              const isToday = new Date().toDateString() === date.toDateString()
              const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString()
              const dateLabel = isToday ? 'Today'
                : isYesterday ? 'Yesterday'
                : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
              const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

              return (
                <div key={i} className="flex items-center gap-4 py-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base
                    ${event.survived
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-stone-100 border border-stone-200'}`}>
                    {event.survived ? '🔥' : '🌱'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-stone-800 text-sm font-medium">
                        {event.survived ? 'Survived' : 'Reset'}
                      </p>
                      {event.hormone_targeted && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize
                          ${HORMONE_COLORS[event.hormone_targeted] || 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                          {event.hormone_targeted}
                        </span>
                      )}
                    </div>
                    {event.spark_used && (
                      <p className="text-stone-400 text-xs mt-0.5 truncate">✦ {event.spark_used}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-stone-500 text-xs">{dateLabel}</p>
                    <p className="text-stone-400 text-xs">{timeLabel}</p>
                    {event.duration_secs && (
                      <p className="text-stone-300 text-xs">{Math.round(event.duration_secs / 60)}m</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

import { useEffect, useState } from 'react'
import Layout, { PageShell } from '../components/Layout'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

const HORMONE_COLORS = {
  dopamine:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  serotonin:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  oxytocin:   'bg-pink-500/10 text-pink-400 border-pink-500/20',
  endorphins: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
      <PageShell>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-black mb-1">Activity</h1>
          <p className="text-stone-500">Every moment you faced a craving, recorded.</p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total sessions', value: total, color: 'text-white' },
            { label: 'Survived',       value: survived, color: 'text-emerald-400' },
            { label: 'Win rate',       value: `${winRate}%`, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-stone-900 border border-white/5 rounded-2xl p-5 text-center">
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-stone-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'survived', 'reset'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize
                ${filter === f
                  ? 'bg-amber-500 text-black'
                  : 'bg-stone-800 text-stone-400 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-stone-900 border border-white/5 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col gap-0 divide-y divide-white/5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-20 bg-stone-800/30 animate-pulse m-0" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="text-5xl mb-4">🌱</div>
              <p className="text-white font-semibold text-lg mb-1">
                {history.length === 0 ? 'No sessions yet' : 'Nothing here yet'}
              </p>
              <p className="text-stone-500 text-sm max-w-sm">
                {history.length === 0
                  ? 'Hit the craving button on the Home screen whenever you feel the urge. Every session is tracked here.'
                  : `No ${filter} sessions to show.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((event, i) => {
                const date = new Date(event.triggered_at)
                const isToday = new Date().toDateString() === date.toDateString()
                const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString()
                const dateLabel = isToday ? 'Today'
                  : isYesterday ? 'Yesterday'
                  : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                return (
                  <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base
                      ${event.survived
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-stone-800 border border-stone-700'}`}>
                      {event.survived ? '🔥' : '🌱'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium">
                          {event.survived ? 'Survived' : 'Reset'}
                        </p>
                        {event.hormone_targeted && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize
                            ${HORMONE_COLORS[event.hormone_targeted] || 'bg-stone-800 text-stone-400 border-stone-700'}`}>
                            {event.hormone_targeted}
                          </span>
                        )}
                      </div>
                      {event.spark_used && (
                        <p className="text-stone-500 text-xs mt-0.5 truncate">✦ {event.spark_used}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-stone-400 text-xs">{dateLabel}</p>
                      <p className="text-stone-600 text-xs">{timeLabel}</p>
                      {event.duration_secs && (
                        <p className="text-stone-700 text-xs">{Math.round(event.duration_secs / 60)}m</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </PageShell>
    </Layout>
  )
}

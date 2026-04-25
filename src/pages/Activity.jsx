import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import RecoveryMap from '../components/RecoveryMap'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

const HORMONE_COLORS = {
  dopamine:   'bg-orange-50 text-orange-600 border-orange-200',
  serotonin:  'bg-blue-50 text-blue-600 border-blue-200',
  oxytocin:   'bg-pink-50 text-pink-600 border-pink-200',
  endorphins: 'bg-purple-50 text-purple-600 border-purple-200',
}

const TABS = [['map', '🗺️ Map'], ['stats', '📊 Stats'], ['log', '📋 Log']]

function FloatingTabs({ tab, setTab }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1 rounded-2xl p-1"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)' }}>
      {TABS.map(([id, label]) => (
        <button key={id} onClick={() => setTab(id)}
          className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all
            ${tab === id ? 'bg-white text-stone-900 shadow' : 'text-white/70 hover:text-white'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Activity() {
  const { user, dayCount } = useEmberStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('map')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    getCravingHistory(user.id, 50).then(data => { setHistory(data); setLoading(false) })
  }, [user])

  const survived = history.filter(e => e.survived).length
  const total    = history.length
  const winRate  = total > 0 ? Math.round((survived / total) * 100) : 0
  const filtered = filter === 'all' ? history
    : filter === 'survived' ? history.filter(e => e.survived)
    : history.filter(e => !e.survived)

  if (tab === 'map') {
    return (
      <Layout noHobbies>
        <div className="relative overflow-hidden"
          style={{ height: 'calc(100vh - 0px)' }}>
          <RecoveryMap dayCount={dayCount} />
          <FloatingTabs tab={tab} setTab={setTab} />
          <div className="absolute bottom-6 right-6 z-20 rounded-2xl px-4 py-3 text-white text-right"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <p className="text-3xl font-black leading-none text-amber-400">{dayCount}</p>
            <p className="text-xs text-white/60 mt-0.5 uppercase tracking-widest">days clean</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout noHobbies>
      <div className="max-w-3xl mx-auto w-full px-6 md:px-12 py-10">
        <div className="mb-6">
          <h1 className="text-4xl font-black text-stone-900 mb-1">Activity</h1>
          <p className="text-stone-400 text-sm">Your recovery journey, mapped and logged.</p>
        </div>

        <div className="flex gap-1 mb-8 bg-stone-100 rounded-2xl p-1 w-fit">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all
                ${tab === id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── STATS ── */}
        {tab === 'stats' && (
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: 'Sessions',  value: total,         color: 'text-stone-900'   },
                { label: 'Survived',  value: survived,      color: 'text-emerald-500' },
                { label: 'Win rate',  value: `${winRate}%`, color: 'text-amber-500'   },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className={`text-5xl font-black leading-none ${color}`}>{value}</p>
                  <p className="text-stone-400 text-xs mt-2 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOG ── */}
        {tab === 'log' && (
          <div>
            <div className="flex gap-2 mb-6">
              {['all', 'survived', 'reset'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize
                    ${filter === f ? 'bg-amber-400 text-black' : 'bg-stone-100 text-stone-500 hover:text-stone-800'}`}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-stone-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">🌱</div>
                <p className="text-stone-800 font-bold text-lg mb-1">
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
                  const isYest  = new Date(Date.now() - 86400000).toDateString() === date.toDateString()
                  const dateLabel = isToday ? 'Today' : isYest ? 'Yesterday'
                    : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

                  return (
                    <div key={i} className="flex items-center gap-4 py-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base border
                        ${event.survived ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-stone-200'}`}>
                        {event.survived ? '🔥' : '🌱'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-stone-900 text-sm font-semibold">
                            {event.survived ? 'Survived' : 'Reset'}
                          </p>
                          {event.hormone_targeted && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize
                              ${HORMONE_COLORS[event.hormone_targeted] || 'bg-stone-50 text-stone-500 border-stone-200'}`}>
                              {event.hormone_targeted}
                            </span>
                          )}
                        </div>
                        {event.spark_used && (
                          <p className="text-stone-400 text-xs mt-0.5 truncate">✦ {event.spark_used}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-stone-600 text-xs">{dateLabel}</p>
                        <p className="text-stone-400 text-xs">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.duration_secs && (
                          <p className="text-stone-400 text-xs">{Math.round(event.duration_secs / 60)}m</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

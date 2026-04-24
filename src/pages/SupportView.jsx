import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SupportView() {
  const { supportCode } = useParams()
  const [events, setEvents] = useState([])
  const [dayCount, setDayCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase
        .from('users').select('id, day_count')
        .eq('support_code', supportCode).single()
      if (!user) { setLoading(false); return }
      setDayCount(user.day_count)
      const { data } = await supabase
        .from('craving_events').select('survived, triggered_at, spark_used, hormone_targeted')
        .eq('user_id', user.id).order('triggered_at', { ascending: false }).limit(20)
      setEvents(data || [])
      setLoading(false)
    }
    load()
    const channel = supabase.channel('support-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'craving_events' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [supportCode])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-start py-16 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-2xl font-black mb-2">Someone you love is fighting.</h1>
          <p className="text-stone-500">This is their anonymous recovery feed.</p>
        </div>

        <div className="bg-gradient-to-br from-amber-950/60 to-stone-900 border border-amber-900/30 rounded-2xl p-8 text-center mb-6">
          <p className="text-stone-400 text-sm mb-2 uppercase tracking-widest">Current streak</p>
          <p className="text-7xl font-black text-amber-400">{dayCount}</p>
          <p className="text-stone-500 mt-1">{dayCount === 1 ? 'day' : 'days'} without giving in</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-stone-800 rounded-xl animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-stone-500">
            <p>No sessions recorded yet.</p>
          </div>
        ) : (
          <div className="bg-stone-900 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {events.map((e, i) => {
              const date = new Date(e.triggered_at)
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0
                    ${e.survived ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-stone-800 border border-stone-700'}`}>
                    {e.survived ? '🔥' : '🌱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{e.survived ? 'Made it through' : 'Needed a reset'}</p>
                    {e.spark_used && <p className="text-stone-500 text-xs truncate">✦ {e.spark_used}</p>}
                  </div>
                  <p className="text-stone-600 text-xs shrink-0">
                    {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-stone-700 text-xs mt-8">Powered by Ember · All data is anonymous</p>
      </div>
    </div>
  )
}

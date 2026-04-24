import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Support() {
  const { supportCode } = useParams()
  const [events, setEvents] = useState([])
  const [dayCount, setDayCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase
        .from('users').select('id, day_count')
        .eq('support_code', supportCode).single()

      if (!user) return
      setDayCount(user.day_count)

      const { data } = await supabase
        .from('craving_events').select('survived, triggered_at')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false })
        .limit(20)

      setEvents(data || [])
    }
    load()

    const channel = supabase
      .channel('support')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'craving_events'
      }, () => load())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [supportCode])

  return (
    <div className="min-h-screen bg-stone-950 text-white p-6 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔥</div>
        <h1 className="text-2xl font-bold">Someone you love is fighting.</h1>
        <p className="text-stone-400 mt-2">This is their anonymous support feed.</p>
      </div>

      <div className="bg-stone-900 rounded-2xl p-6 text-center mb-6 border border-stone-800">
        <p className="text-stone-400 text-sm">Current streak</p>
        <p className="text-5xl font-bold text-amber-400 mt-1">{dayCount} days</p>
      </div>

      <div className="flex flex-col gap-3">
        {events.map((event, i) => (
          <div key={i} className={`rounded-xl p-4 border ${
            event.survived
              ? 'bg-emerald-950/50 border-emerald-800'
              : 'bg-stone-900 border-stone-800'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{event.survived ? '🟢' : '🌱'}</span>
              <div>
                <p className="text-white text-sm font-medium">
                  {event.survived ? 'Made it through' : 'Needed a reset'}
                </p>
                <p className="text-stone-500 text-xs">
                  {new Date(event.triggered_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

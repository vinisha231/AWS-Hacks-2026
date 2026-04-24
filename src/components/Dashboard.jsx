import { useEffect, useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { getCravingHistory } from '../lib/supabase'

export default function Dashboard() {
  const { user, dayCount, sparkProfile } = useEmberStore()
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (user?.id) {
      getCravingHistory(user.id, 10).then(setHistory)
    }
  }, [user])

  const survived = history.filter(e => e.survived).length
  const total = history.length
  const topSpark = Object.entries(sparkProfile)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-900 rounded-xl p-4 text-center border border-stone-800">
          <p className="text-2xl font-bold text-amber-400">{survived}</p>
          <p className="text-stone-500 text-xs mt-1">Survived</p>
        </div>
        <div className="bg-stone-900 rounded-xl p-4 text-center border border-stone-800">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-stone-500 text-xs mt-1">Total</p>
        </div>
        <div className="bg-stone-900 rounded-xl p-4 text-center border border-stone-800">
          <p className="text-2xl font-bold text-emerald-400">
            {total > 0 ? Math.round((survived / total) * 100) : 0}%
          </p>
          <p className="text-stone-500 text-xs mt-1">Win rate</p>
        </div>
      </div>

      {topSpark && (
        <div className="bg-stone-900 rounded-xl p-4 border border-stone-800">
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Your spark identity</p>
          <p className="text-white font-semibold capitalize">✨ {topSpark} explorer</p>
        </div>
      )}

      {user?.support_code && (
        <div className="bg-stone-900 rounded-xl p-4 border border-stone-800">
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">Support circle link</p>
          <p className="text-amber-400 text-sm font-mono">
            ember.app/support/{user.support_code}
          </p>
          <p className="text-stone-500 text-xs mt-1">Share this with people you trust</p>
        </div>
      )}
    </div>
  )
}

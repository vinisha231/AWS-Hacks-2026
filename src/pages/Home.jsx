import { useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { useEmberAuth } from '../hooks/useEmberAuth'
import Layout from '../components/Layout'
import CravingInterceptor from '../components/CravingInterceptor'
import MoodSelector from '../components/MoodSelector'
import StreakCalendar from '../components/StreakCalendar'
import MilestoneBadges from '../components/MilestoneBadges'
import DailyAffirmation from '../components/DailyAffirmation'
import RecentActivity from '../components/RecentActivity'

export default function Home() {
  const [showMood, setShowMood] = useState(false)
  const [showInterceptor, setShowInterceptor] = useState(false)
  const { dayCount, activateCraving, setLastMoodAnalysis, user } = useEmberStore()
  useEmberAuth()

  const handleMoodSelect = (hormone) => {
    setLastMoodAnalysis({ depletedHormone: hormone, contextFlags: {} })
    setShowMood(false)
    activateCraving()
    setShowInterceptor(true)
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8">

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Streak hero */}
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-950/80 via-stone-900 to-stone-900 border border-amber-900/30 p-8">
            <div className="absolute -right-6 -top-6 text-[160px] leading-none opacity-[0.07] select-none pointer-events-none">🔥</div>
            <p className="text-stone-400 text-sm font-medium mb-2 uppercase tracking-widest">Current streak</p>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-8xl font-black text-amber-400 leading-none">{dayCount}</span>
              <span className="text-stone-500 text-2xl mb-2">{dayCount === 1 ? 'day' : 'days'}</span>
            </div>
            <p className="text-stone-400 text-sm">
              {dayCount === 0 && 'Every ember starts with a single spark. Start now.'}
              {dayCount >= 1 && dayCount < 7 && `${7 - dayCount} more days to your first week badge ⚡`}
              {dayCount >= 7 && dayCount < 30 && `${30 - dayCount} days away from one month 💎`}
              {dayCount >= 30 && dayCount < 100 && `${100 - dayCount} days from 100. You're remarkable. 👑`}
              {dayCount >= 100 && 'You are in the top 1%. Keep the flame alive. 🔥'}
            </p>

            <button
              onClick={() => setShowMood(true)}
              className="mt-6 w-full md:w-auto bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              🚨 I'm having a craving
            </button>
          </div>

          {/* Quick numbers */}
          <div className="flex flex-col gap-4">
            <StatCard emoji="🏆" label="Best streak" value={`${dayCount} days`} color="text-amber-400" />
            <StatCard emoji="✊" label="Cravings survived" value="—" color="text-emerald-400" userId={user?.id} statKey="survived" />
            <StatCard emoji="⚡" label="Win rate" value="—" color="text-blue-400" userId={user?.id} statKey="winrate" />
          </div>
        </div>

        <DailyAffirmation />

        {/* Two-column section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StreakCalendar />
          <MilestoneBadges />
        </div>

        <RecentActivity />
      </div>

      {showMood && (
        <MoodSelector
          onSelect={handleMoodSelect}
          onSkip={() => { setShowMood(false); activateCraving(); setShowInterceptor(true) }}
        />
      )}
      {showInterceptor && (
        <CravingInterceptor onClose={() => setShowInterceptor(false)} />
      )}
    </Layout>
  )
}

function StatCard({ emoji, label, value, color }) {
  return (
    <div className="flex-1 bg-stone-900 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-stone-500 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  )
}

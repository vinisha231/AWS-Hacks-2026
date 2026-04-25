import { useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { useEmberAuth } from '../hooks/useEmberAuth'
import Layout from '../components/Layout'
import CravingInterceptor from '../components/CravingInterceptor'
import VoiceCheckin from '../components/VoiceCheckin'
import StreakCalendar from '../components/StreakCalendar'
import MilestoneBadges from '../components/MilestoneBadges'
import DailyAffirmation from '../components/DailyAffirmation'
import RecentActivity from '../components/RecentActivity'
import DailyCheckin from '../components/DailyCheckin'
import { AlertIcon } from '../components/Icons'

export default function Home() {
  const [phase, setPhase] = useState('idle')   // idle | voice | craving
  const { dayCount, activateCraving, setLastMoodAnalysis } = useEmberStore()
  useEmberAuth()

  const handleCravingButton = () => {
    activateCraving()
    setPhase('voice')
  }

  const handleVoiceComplete = (moodAnalysis) => {
    setLastMoodAnalysis(moodAnalysis)
    setPhase('craving')
  }

  const handleVoiceSkip = () => {
    setPhase('craving')
  }

  const handleClose = () => setPhase('idle')

  return (
    <Layout>
      <div className="flex flex-col gap-6">

        {/* Streak hero */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-950/70 via-stone-900 to-stone-900 border border-amber-900/25 p-8 md:p-10">
          <div className="absolute -right-8 -top-8 text-[180px] leading-none opacity-[0.06] select-none pointer-events-none">🔥</div>
          <p className="text-stone-400 text-xs uppercase tracking-[0.2em] font-medium mb-3">Current streak</p>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-8xl md:text-9xl font-black text-amber-400 leading-none tabular-nums">{dayCount}</span>
            <span className="text-stone-500 text-2xl mb-3">{dayCount === 1 ? 'day' : 'days'}</span>
          </div>
          <p className="text-stone-400 text-sm mb-8">
            {dayCount === 0 && 'Every ember starts with a single spark. When you\'re ready.'}
            {dayCount >= 1 && dayCount < 7 && `${7 - dayCount} more days to your first week. You're building something real.`}
            {dayCount >= 7 && dayCount < 30 && `${30 - dayCount} days to one month. The hardest part is already behind you.`}
            {dayCount >= 30 && `Day ${dayCount}. You're in territory most people never reach.`}
          </p>

          <button
            onClick={handleCravingButton}
            className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-bold text-base px-7 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20"
          >
            <AlertIcon size={20} className="text-black" />
            I'm having a craving
          </button>
        </div>

        <DailyAffirmation />

        <DailyCheckin />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Day streak',   value: dayCount, color: 'text-amber-400' },
            { label: 'Days clean',   value: dayCount, color: 'text-emerald-400' },
            { label: 'Milestone',    value: dayCount >= 30 ? '💎' : dayCount >= 7 ? '⚡' : dayCount >= 1 ? '🌱' : '—', color: 'text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-stone-900 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-stone-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StreakCalendar />
          <MilestoneBadges />
        </div>

        <RecentActivity />
      </div>

      {phase === 'voice' && (
        <VoiceCheckin
          onComplete={handleVoiceComplete}
          onSkip={handleVoiceSkip}
        />
      )}
      {phase === 'craving' && (
        <CravingInterceptor onClose={handleClose} />
      )}
    </Layout>
  )
}

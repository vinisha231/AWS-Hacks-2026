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
import FloatingHobbies from '../components/FloatingHobbies'
import ProfileSetupModal from '../components/ProfileSetupModal'
import CalmPage from './CalmPage'

export default function Home() {
  const [phase, setPhase] = useState('idle') // idle | calm | voice | craving
  const { dayCount, activateCraving, setLastMoodAnalysis, profileSetupDone, userInterests } = useEmberStore()
  useEmberAuth()

  const handleCravingButton = () => {
    activateCraving()
    setPhase('calm')
  }

  const handleCalmContinue = () => setPhase('voice')

  const handleVoiceComplete = (moodAnalysis) => {
    setLastMoodAnalysis(moodAnalysis)
    setPhase('craving')
  }

  const handleVoiceSkip = () => setPhase('craving')
  const handleClose = () => setPhase('idle')

  return (
    <>
      {!profileSetupDone && <ProfileSetupModal />}

      <Layout>
        <div className="flex flex-col gap-6">

          {/* Hero card — notebook paper look with floating hobbies */}
          <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-sm"
            style={{ background: '#fffef9', minHeight: '280px' }}>

            <FloatingHobbies interests={userInterests} />

            <div className="relative z-10 p-8 md:p-10 flex flex-col items-start">

              <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-semibold mb-2">
                Current streak
              </p>

              <div className="flex items-end gap-3 mb-3">
                <span className="text-7xl md:text-8xl font-black text-amber-500 leading-none tabular-nums drop-shadow-sm">
                  {dayCount}
                </span>
                <span className="text-stone-400 text-xl mb-2">{dayCount === 1 ? 'day' : 'days'}</span>
              </div>

              <p className="text-stone-500 text-sm mb-8 max-w-xs leading-relaxed">
                {dayCount === 0 && "Every ember starts with a single spark. You've got this."}
                {dayCount >= 1 && dayCount < 7 && `${7 - dayCount} more days to your first week. Keep going.`}
                {dayCount >= 7 && dayCount < 30 && `${30 - dayCount} days to one month. The hardest part is behind you.`}
                {dayCount >= 30 && `Day ${dayCount}. You're in territory most people never reach.`}
              </p>

              {/* THE BIG RED BUTTON */}
              <button
                onClick={handleCravingButton}
                className="animate-pulse-ring relative group flex items-center gap-3 text-white font-black text-lg px-8 py-5 rounded-2xl transition-all active:scale-[0.97] shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 8px 32px rgba(239,68,68,0.4), 0 2px 8px rgba(239,68,68,0.3)'
                }}>
                <span className="text-2xl">🆘</span>
                I'm craving right now
              </button>
              <p className="text-stone-400 text-xs mt-3 ml-1">Press this the moment you feel the urge</p>
            </div>
          </div>

          {/* Quick stats — light notebook cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Day streak',  value: dayCount,         color: 'text-amber-500' },
              { label: 'Days clean',  value: dayCount,         color: 'text-emerald-600' },
              { label: 'Milestone',   value: dayCount >= 30 ? '💎' : dayCount >= 7 ? '⚡' : dayCount >= 1 ? '🌱' : '—', color: 'text-stone-800' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-stone-200 rounded-2xl p-4 text-center shadow-sm">
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <p className="text-stone-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          <DailyAffirmation />
          <DailyCheckin />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StreakCalendar />
            <MilestoneBadges />
          </div>

          <RecentActivity />
        </div>
      </Layout>

      {phase === 'calm' && <CalmPage onContinue={handleCalmContinue} />}
      {phase === 'voice' && (
        <VoiceCheckin onComplete={handleVoiceComplete} onSkip={handleVoiceSkip} />
      )}
      {phase === 'craving' && <CravingInterceptor onClose={handleClose} />}
    </>
  )
}

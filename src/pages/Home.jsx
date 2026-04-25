import { useState, useEffect } from 'react'
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
import RelapseModal from '../components/RelapseModal'
import CalmPage from './CalmPage'

export default function Home() {
  const [phase, setPhase] = useState('idle')
  const [showRelapse, setShowRelapse] = useState(false)
  const { dayCount, activateCraving, setLastMoodAnalysis,
    profileSetupDone, userInterests, recordLogin } = useEmberStore()
  useEmberAuth()

  useEffect(() => { recordLogin() }, [])

  const handleCravingButton = () => { activateCraving(); setPhase('calm') }
  const handleCalmContinue = () => setPhase('voice')
  const handleVoiceComplete = (m) => { setLastMoodAnalysis(m); setPhase('craving') }
  const handleVoiceSkip = () => setPhase('craving')
  const handleClose = () => setPhase('idle')

  return (
    <>
      {!profileSetupDone && <ProfileSetupModal />}

      <Layout>
        {/* ── Full-bleed hero canvas ── */}
        <div className="relative overflow-hidden" style={{ minHeight: '88vh' }}>

          {/* Hobby elements float across the ENTIRE hero canvas */}
          <FloatingHobbies interests={userInterests} />

          {/* Very subtle radial glow centers on the button area */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 55%, rgba(251,191,36,0.07) 0%, transparent 70%)' }} />

          {/* Content — directly on the canvas, no card */}
          <div className="relative z-10 flex flex-col justify-center min-h-[88vh] px-8 md:px-16 lg:px-24">

            <p className="text-xs uppercase tracking-[0.22em] text-stone-400 font-semibold mb-4">
              Current streak
            </p>

            <div className="flex items-end gap-4 mb-4">
              <span className="font-black text-amber-500 leading-none tabular-nums"
                style={{ fontSize: 'clamp(5rem, 18vw, 11rem)' }}>
                {dayCount}
              </span>
              <span className="text-stone-400 text-2xl md:text-3xl mb-3 font-light">
                {dayCount === 1 ? 'day' : 'days'}
              </span>
            </div>

            <p className="text-stone-400 text-base md:text-lg mb-12 max-w-sm leading-relaxed font-light">
              {dayCount === 0 && "Every journey starts with a single day. You've got this."}
              {dayCount >= 1 && dayCount < 7 && `${7 - dayCount} more days to your first week. Keep going.`}
              {dayCount >= 7 && dayCount < 30 && `${30 - dayCount} days to one month. The hardest part is behind you.`}
              {dayCount >= 30 && `Day ${dayCount}. You're in territory most people never reach.`}
            </p>

            {/* THE BIG RED BUTTON */}
            <div className="flex flex-col items-start gap-4">
              <button
                onClick={handleCravingButton}
                className="animate-pulse-ring relative flex items-center gap-4 text-white font-black text-xl md:text-2xl px-10 py-6 rounded-2xl transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 12px 48px rgba(239,68,68,0.35), 0 4px 16px rgba(239,68,68,0.25)'
                }}>
                <span className="text-3xl">🆘</span>
                I'm craving right now
              </button>

              <p className="text-stone-400 text-sm ml-1">Press this the moment you feel the urge</p>

              <button
                onClick={() => setShowRelapse(true)}
                className="text-stone-400 hover:text-red-400 text-sm underline underline-offset-4 transition-colors ml-1 mt-2">
                I relapsed
              </button>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
            <div className="w-px h-8 bg-stone-400" />
            <span className="text-stone-400 text-xs tracking-widest uppercase">scroll</span>
          </div>
        </div>

        {/* ── Content section below — contained ── */}
        <div className="px-6 md:px-12 lg:px-20 py-12 flex flex-col gap-6 max-w-4xl">

          {/* Quick stats — inline, no heavy cards */}
          <div className="flex gap-6 md:gap-10">
            {[
              { label: 'Day streak',  value: dayCount,  color: 'text-amber-500' },
              { label: 'Days clean',  value: dayCount,  color: 'text-emerald-600' },
              { label: 'Milestone',   value: dayCount >= 30 ? '💎' : dayCount >= 7 ? '⚡' : dayCount >= 1 ? '🌱' : '—', color: 'text-stone-700' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className={`text-4xl font-black ${color}`}>{value}</p>
                <p className="text-stone-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-stone-200" />

          <DailyAffirmation />
          <DailyCheckin />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StreakCalendar />
            <MilestoneBadges />
          </div>

          <RecentActivity />
        </div>
      </Layout>

      {phase === 'calm'    && <CalmPage onContinue={handleCalmContinue} />}
      {phase === 'voice'   && <VoiceCheckin onComplete={handleVoiceComplete} onSkip={handleVoiceSkip} />}
      {phase === 'craving' && <CravingInterceptor onClose={handleClose} />}
      {showRelapse         && <RelapseModal onClose={() => setShowRelapse(false)} />}
    </>
  )
}

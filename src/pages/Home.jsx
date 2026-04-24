import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmberStore } from '../store/emberStore'
import { useEmberAuth } from '../hooks/useEmberAuth'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import CravingInterceptor from '../components/CravingInterceptor'
import MoodSelector from '../components/MoodSelector'
import QuickStats from '../components/QuickStats'
import StreakCalendar from '../components/StreakCalendar'
import MilestoneBadges from '../components/MilestoneBadges'
import DailyAffirmation from '../components/DailyAffirmation'

export default function Home() {
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [showInterceptor, setShowInterceptor] = useState(false)
  const { dayCount, activateCraving, setLastMoodAnalysis } = useEmberStore()
  const navigate = useNavigate()
  useEmberAuth()

  const handleCravingButton = () => {
    setShowMoodSelector(true)
  }

  const handleMoodSelect = (hormone) => {
    setLastMoodAnalysis({ depletedHormone: hormone, contextFlags: {} })
    setShowMoodSelector(false)
    activateCraving()
    setShowInterceptor(true)
  }

  const handleMoodSkip = () => {
    setShowMoodSelector(false)
    activateCraving()
    setShowInterceptor(true)
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-lg tracking-tight">Ember</span>
        </div>
        <div className="flex items-center gap-2">
          <WalletMultiButton style={{ background: '#1c1917', fontSize: '12px', padding: '8px 14px' }} />
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-base transition-colors"
          >
            👤
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 flex flex-col gap-5 pb-16">

        {/* Streak hero */}
        <div className="relative bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-900 rounded-3xl p-6 border border-amber-900/30 overflow-hidden">
          <div className="absolute top-0 right-0 text-[120px] leading-none opacity-10 select-none pointer-events-none">🔥</div>
          <p className="text-stone-400 text-sm mb-1">Current streak</p>
          <div className="flex items-end gap-3">
            <p className="text-7xl font-black text-amber-400 leading-none">{dayCount}</p>
            <p className="text-stone-400 mb-2 text-lg">{dayCount === 1 ? 'day' : 'days'}</p>
          </div>
          <p className="text-stone-500 text-sm mt-2">
            {dayCount === 0
              ? 'Every ember starts with a single spark.'
              : dayCount < 7
              ? `${7 - dayCount} days to your first week badge ⚡`
              : dayCount < 30
              ? `${30 - dayCount} days to one month 💎`
              : 'You\'re doing something remarkable. 👑'}
          </p>
        </div>

        {/* THE button */}
        <button
          onClick={handleCravingButton}
          className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-xl py-5 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
        >
          🚨 I'm having a craving
        </button>

        <DailyAffirmation />

        <QuickStats />

        <StreakCalendar />

        <MilestoneBadges />

      </main>

      {showMoodSelector && (
        <MoodSelector onSelect={handleMoodSelect} onSkip={handleMoodSkip} />
      )}

      {showInterceptor && (
        <CravingInterceptor onClose={() => setShowInterceptor(false)} />
      )}
    </div>
  )
}

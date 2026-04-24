import { useState } from 'react'
import { useEmberStore } from '../store/emberStore'
import { useEmberAuth } from '../hooks/useEmberAuth'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import CravingInterceptor from '../components/CravingInterceptor'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const [showInterceptor, setShowInterceptor] = useState(false)
  const { dayCount, activateCraving } = useEmberStore()
  useEmberAuth()

  const handleCravingButton = () => {
    activateCraving()
    setShowInterceptor(true)
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <header className="flex items-center justify-between p-6 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-lg">Ember</span>
        </div>
        <WalletMultiButton style={{ background: '#1c1917', fontSize: '13px' }} />
      </header>

      <main className="max-w-lg mx-auto p-6 flex flex-col gap-6">
        <div className="bg-stone-900 rounded-2xl p-6 text-center border border-stone-800">
          <p className="text-stone-400 text-sm mb-1">Days burning</p>
          <p className="text-6xl font-bold text-amber-400">{dayCount}</p>
        </div>

        <button
          onClick={handleCravingButton}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xl py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-500/20"
        >
          🚨 I'm having a craving
        </button>

        <Dashboard />
      </main>

      {showInterceptor && (
        <CravingInterceptor onClose={() => setShowInterceptor(false)} />
      )}
    </div>
  )
}

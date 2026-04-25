import { useState } from 'react'
import { useEmberStore } from '../store/emberStore'

const INTERESTS = [
  { label: 'Drawing',           emoji: '✏️' },
  { label: 'Music',             emoji: '🎵' },
  { label: 'Cooking',           emoji: '🍳' },
  { label: 'Gardening',         emoji: '🌱' },
  { label: 'Photography',       emoji: '📷' },
  { label: 'Writing',           emoji: '✍️' },
  { label: 'Puzzles',           emoji: '🧩' },
  { label: 'Coding',            emoji: '💻' },
  { label: 'Astronomy',         emoji: '🔭' },
  { label: 'Chess',             emoji: '♟️' },
  { label: 'Languages',         emoji: '🌍' },
  { label: 'Magic tricks',      emoji: '🪄' },
  { label: 'Origami',           emoji: '🦢' },
  { label: 'Hiking',            emoji: '🥾' },
  { label: 'Reading',           emoji: '📚' },
  { label: 'Poetry',            emoji: '📜' },
]

const ADDICTION_OPTIONS = [
  { label: 'Nicotine',     emoji: '🚬' },
  { label: 'Alcohol',      emoji: '🍺' },
  { label: 'Cannabis',     emoji: '🌿' },
  { label: 'Gambling',     emoji: '🎰' },
  { label: 'Social media', emoji: '📱' },
  { label: 'Gaming',       emoji: '🎮' },
  { label: 'Opioids',      emoji: '💊' },
  { label: 'Food',         emoji: '🍔' },
  { label: 'Shopping',     emoji: '🛍️' },
  { label: 'Other',        emoji: '•'  },
]

export default function ProfileSetupModal() {
  const { completeProfileSetup } = useEmberStore()
  const [step, setStep] = useState(0)
  const [addictions, setAddictions] = useState([])
  const [interests, setInterests] = useState([])

  const toggle = (list, setList, val) =>
    setList(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val])

  const finish = () => {
    completeProfileSetup(interests, addictions)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(8px)' }}>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-stone-200/80 border border-stone-100 overflow-hidden animate-slide-up">

        {/* Progress bar */}
        <div className="h-1 bg-stone-100">
          <div className="h-1 bg-amber-400 transition-all duration-500"
            style={{ width: step === 0 ? '50%' : '100%' }} />
        </div>

        <div className="p-8">
          {step === 0 && (
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-semibold mb-2">Step 1 of 2</p>
              <h2 className="text-2xl font-black text-stone-900 mb-1">What are you working on?</h2>
              <p className="text-stone-400 text-sm mb-6">No judgment. This helps Ember show up right for you.</p>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {ADDICTION_OPTIONS.map(({ label, emoji }) => (
                  <button key={label}
                    onClick={() => toggle(addictions, setAddictions, label)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-medium transition-all text-left
                      ${addictions.includes(label)
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={addictions.length === 0}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-30 text-black font-bold py-4 rounded-2xl transition-all text-sm">
                Next →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-semibold mb-2">Step 2 of 2</p>
              <h2 className="text-2xl font-black text-stone-900 mb-1">What do you love?</h2>
              <p className="text-stone-400 text-sm mb-6">These become your Spark activities — and they'll float around your home page.</p>
              <div className="grid grid-cols-3 gap-2 mb-8">
                {INTERESTS.map(({ label, emoji }) => (
                  <button key={label}
                    onClick={() => toggle(interests, setInterests, label)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border text-xs font-medium transition-all
                      ${interests.includes(label)
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                    <span className="text-xl">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)}
                  className="px-5 py-4 rounded-2xl border border-stone-200 text-stone-500 text-sm font-medium hover:border-stone-300">
                  ←
                </button>
                <button
                  onClick={finish}
                  disabled={interests.length === 0}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-30 text-black font-bold py-4 rounded-2xl transition-all text-sm">
                  Let's go ✨
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

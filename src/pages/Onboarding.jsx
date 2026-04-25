import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEmberStore } from '../store/emberStore'

const ADDICTION_TYPES = [
  'Nicotine', 'Alcohol', 'Cannabis', 'Gambling',
  'Social media', 'Gaming', 'Opioids', 'Other'
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [addictionType, setAddictionType] = useState('')
  const [curiosities, setCuriosities] = useState('')
  const [safeTopics, setSafeTopics] = useState('')
  const [loading, setLoading] = useState(false)

  const { session, setUser } = useEmberStore()
  const navigate = useNavigate()

  const handleComplete = async () => {
    setLoading(true)
    const { data } = await supabase.from('users')
      .update({ addiction_type: addictionType })
      .eq('auth0_id', session?.user?.id)
      .select().single()

    setUser(data)
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-3xl font-bold">Let's meet you</h1>
          <p className="text-stone-400 mt-2">Everything here is private and anonymous.</p>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">What are you working on?</h2>
            <div className="grid grid-cols-2 gap-3">
              {ADDICTION_TYPES.map(type => (
                <button key={type}
                  onClick={() => setAddictionType(type)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all
                    ${addictionType === type
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!addictionType}
              className="w-full bg-amber-500 disabled:opacity-30 text-black font-semibold py-3 rounded-xl mt-2 transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">What have you always been curious about?</h2>
            <p className="text-stone-400 text-sm">Things you've never tried. Topics you watch videos about at 2am. Dreams from childhood.</p>
            <textarea
              value={curiosities}
              onChange={e => setCuriosities(e.target.value)}
              placeholder="e.g. Japanese words, magic tricks, ancient history, drawing..."
              className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-white placeholder-stone-600 resize-none h-32 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => setStep(3)}
              className="w-full bg-amber-500 text-black font-semibold py-3 rounded-xl transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Are there topics that feel heavy for you?</h2>
            <p className="text-stone-400 text-sm">We'll make sure Ember never brings these up. Completely optional.</p>
            <textarea
              value={safeTopics}
              onChange={e => setSafeTopics(e.target.value)}
              placeholder="e.g. cooking (reminds me of someone I lost), sports bars, family gatherings..."
              className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-white placeholder-stone-600 resize-none h-32 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-amber-500 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? 'Setting up...' : 'Start my journey 🔥'}
            </button>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map(n => (
            <div key={n} className={`w-2 h-2 rounded-full transition-all ${step === n ? 'bg-amber-500' : 'bg-stone-700'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

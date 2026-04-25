import { useState, useEffect, useCallback, useRef } from 'react'
import { useEmberStore } from '../store/emberStore'
import { generateSpark } from '../services/gemini'
import { playVoiceMessage } from '../services/elevenlabs'
import { mintMilestone } from '../services/solana'
import { useWallet } from '@solana/wallet-adapter-react'
import { logCravingEvent, updateSparkResonance } from '../lib/supabase'
import { TimerIcon, CheckIcon, SeedIcon, AlertIcon, FlameIcon } from './Icons'

const CRAVING_SECONDS = 420

const FALLBACK_SPARKS = [
  {
    title: 'Breathe Through It',
    instruction: 'Place one hand on your chest and breathe in for 4 counts, hold for 4, out for 6. Repeat slowly, feeling your heartbeat settle with each cycle.',
    durationMinutes: 7, hormoneTarget: 'serotonin', category: 'mindfulness',
    openingLine: "I'm right here. Let's breathe through this together, one breath at a time."
  },
  {
    title: 'Count Everything Blue',
    instruction: 'Look around your space and count every single blue object you can find — objects, patterns, hints of blue anywhere. Then count again more slowly.',
    durationMinutes: 7, hormoneTarget: 'dopamine', category: 'curiosity',
    openingLine: "Let's give your mind something new to chase. Look for blue — everywhere."
  },
  {
    title: 'Move for 7 Minutes',
    instruction: 'Stand up and march in place, roll your shoulders back 10 times, do 10 slow arm circles each direction. Keep moving until the timer ends.',
    durationMinutes: 7, hormoneTarget: 'endorphins', category: 'movement',
    openingLine: "Your body needs to move right now. Let's get you out of your head and into your body."
  },
]

export default function CravingInterceptor({ onClose }) {
  const [phase, setPhase] = useState('loading')
  const [spark, setSpark] = useState(null)
  const [timeLeft, setTimeLeft] = useState(CRAVING_SECONDS)
  const [photoUrl, setPhotoUrl] = useState(null)
  const timerRef = useRef(null)
  const sparkRef = useRef(null)
  const fileRef = useRef(null)

  const { user, sparkProfile, flaggedTriggers, usedActivitiesToday, primaryVoiceId,
    resolveCraving, addUsedActivity, dayCount, lastMoodAnalysis } = useEmberStore()
  const wallet = useWallet()

  useEffect(() => {
    init()
    return () => clearInterval(timerRef.current)
  }, [])

  async function init() {
    try {
      const hour = new Date().getHours()
      const contextFlags = {
        isNighttime: hour > 21 || hour < 7,
        seemsIsolated: true,
        highStress: true,
        ...(lastMoodAnalysis?.contextFlags || {})
      }
      const depletedHormone = lastMoodAnalysis?.depletedHormone || 'serotonin'

      let sparkData
      try {
        sparkData = await generateSpark({ depletedHormone, contextFlags, sparkProfile, usedActivities: usedActivitiesToday, flaggedTriggers })
        if (!sparkData?.title) throw new Error('Bad spark response')
      } catch (e) {
        console.warn('Gemini failed, using fallback:', e.message)
        sparkData = FALLBACK_SPARKS[Math.floor(Math.random() * FALLBACK_SPARKS.length)]
      }

      sparkRef.current = sparkData
      setSpark(sparkData)
      setPhase('redirecting')
      addUsedActivity(sparkData.title)

      try {
        await playVoiceMessage(sparkData.openingLine, primaryVoiceId)
      } catch (e) {
        console.warn('Voice failed:', e.message)
      }

      startTimer()
    } catch (err) {
      console.error('Init failed:', err)
      // Even on total failure, show a fallback
      const fallback = FALLBACK_SPARKS[0]
      sparkRef.current = fallback
      setSpark(fallback)
      setPhase('redirecting')
      startTimer()
    }
  }

  function startTimer() {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSurvived(sparkRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const handleSurvived = useCallback(async (sparkData) => {
    setPhase('survived')
    resolveCraving(true, sparkData?.category)

    if (user?.id) {
      await logCravingEvent(user.id, {
        survived: true,
        spark_used: sparkData?.title,
        hormone_targeted: sparkData?.hormoneTarget,
        duration_secs: CRAVING_SECONDS
      })
      if (sparkData?.category) await updateSparkResonance(user.id, sparkData.category, 1)
    }

    if (wallet.connected) {
      try {
        await mintMilestone(wallet, 'craving_survived', dayCount)
      } catch (e) {
        console.warn('Solana:', e.message)
      }
    }

    try {
      await playVoiceMessage(
        `You did it. Day ${dayCount + 1}. That was real strength — I'm proud of you.`,
        primaryVoiceId
      )
    } catch (e) {}
  }, [user, wallet, dayCount, primaryVoiceId])

  const handleRelapse = () => {
    clearInterval(timerRef.current)
    setPhase('relapsed')
    resolveCraving(false)
    if (user?.id) logCravingEvent(user.id, { survived: false, duration_secs: CRAVING_SECONDS - timeLeft })
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) setPhotoUrl(URL.createObjectURL(file))
  }

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = ((CRAVING_SECONDS - timeLeft) / CRAVING_SECONDS) * 100
  const circ = 2 * Math.PI * 45

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 p-6 overflow-y-auto">

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <FlameIcon size={48} className="text-amber-500 animate-pulse" />
          <p className="text-stone-400">Finding your spark…</p>
        </div>
      )}

      {/* Active timer */}
      {phase === 'redirecting' && spark && (
        <div className="flex flex-col items-center gap-6 max-w-md w-full">

          {/* Timer ring */}
          <div className="relative w-40 h-40 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1c1917" strokeWidth="5" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="5"
                strokeDasharray={`${(progress / 100) * circ} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-3xl font-black font-mono">{fmt(timeLeft)}</span>
              <span className="text-stone-600 text-xs">remaining</span>
            </div>
          </div>

          {/* Spark card */}
          <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-6 w-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-amber-500 uppercase tracking-widest font-semibold">{spark.category}</span>
              <span className="text-stone-700">·</span>
              <span className="text-xs text-stone-500 capitalize">{spark.hormoneTarget}</span>
            </div>
            <h2 className="text-white text-2xl font-bold mb-3">{spark.title}</h2>
            <p className="text-stone-300 leading-relaxed text-sm">{spark.instruction}</p>
          </div>

          {/* Photo capture */}
          <div className="w-full">
            {photoUrl ? (
              <div className="relative">
                <img src={photoUrl} alt="Activity" className="w-full h-40 object-cover rounded-xl" />
                <button onClick={() => setPhotoUrl(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">Remove</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full border border-white/[0.06] border-dashed rounded-xl py-3 text-stone-600 text-sm hover:border-white/20 hover:text-stone-400 transition-all flex items-center justify-center gap-2">
                <span>📷</span> Capture a moment from this activity
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handlePhotoUpload} />
          </div>

          <button onClick={handleRelapse}
            className="text-stone-600 text-xs underline underline-offset-4 hover:text-stone-400 transition-colors">
            I need more help
          </button>
        </div>
      )}

      {/* SURVIVED — celebration */}
      {phase === 'survived' && (
        <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">

          {/* Glow orb */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-500 blur-3xl opacity-20 scale-150" />
            <div className="relative w-28 h-28 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <FlameIcon size={52} className="text-amber-400" />
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-black text-white mb-2">You made it.</h2>
            <p className="text-amber-400 text-xl font-bold">Day {dayCount}</p>
            <p className="text-stone-400 mt-1">The craving had no power over you.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { label: 'Minutes held', value: '7' },
              { label: 'Day streak',   value: dayCount },
              { label: 'On-chain',     value: wallet.connected ? '✓' : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-stone-900 border border-white/[0.06] rounded-xl p-3 text-center">
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-stone-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Photo if taken */}
          {photoUrl && (
            <div className="w-full">
              <img src={photoUrl} alt="Activity moment" className="w-full h-44 object-cover rounded-2xl" />
              <p className="text-stone-500 text-xs mt-2 text-center">Your moment from today's spark</p>
            </div>
          )}

          {/* Message */}
          <div className="bg-gradient-to-br from-amber-950/60 to-stone-900 border border-amber-900/30 rounded-2xl p-5 w-full text-left">
            <p className="text-stone-300 text-sm leading-relaxed">
              Every time you do this — every single time — you're rewiring your brain.
              You're not just surviving a craving. You're becoming someone who does.
            </p>
          </div>

          {wallet.connected && (
            <p className="text-cyan-400 text-xs flex items-center gap-1.5">
              <CheckIcon size={14} className="text-cyan-400" />
              Milestone minted on Solana devnet
            </p>
          )}

          <button onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20">
            Keep the flame alive
          </button>
        </div>
      )}

      {/* RELAPSED */}
      {phase === 'relapsed' && (
        <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
          <div className="w-24 h-24 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
            <SeedIcon size={44} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white mb-2">It's okay.</h2>
            <p className="text-stone-400">Relapses are part of recovery, not the end of it.</p>
          </div>
          <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-5 w-full text-left">
            <p className="text-stone-300 text-sm leading-relaxed">
              Every person who made it through came back after moments like this.
              Day 1 starts now — and it counts just as much as any other day.
            </p>
          </div>
          <button onClick={onClose}
            className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-4 rounded-2xl transition-all">
            Start again — I'm still here
          </button>
        </div>
      )}
    </div>
  )
}

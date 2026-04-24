import { useState, useEffect, useCallback, useRef } from 'react'
import { useEmberStore } from '../store/emberStore'
import { generateSpark } from '../services/gemini'
import { playVoiceMessage } from '../services/elevenlabs'
import { mintMilestone } from '../services/solana'
import { useWallet } from '@solana/wallet-adapter-react'
import { logCravingEvent, updateSparkResonance } from '../lib/supabase'

const CRAVING_SECONDS = 420

export default function CravingInterceptor({ onClose }) {
  const [phase, setPhase] = useState('loading')
  const [spark, setSpark] = useState(null)
  const [timeLeft, setTimeLeft] = useState(CRAVING_SECONDS)
  const timerRef = useRef(null)
  const sparkRef = useRef(null)

  const {
    user, sparkProfile, flaggedTriggers, usedActivitiesToday,
    primaryVoiceId, resolveCraving, addUsedActivity, dayCount,
    lastMoodAnalysis
  } = useEmberStore()

  const wallet = useWallet()

  useEffect(() => {
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

        const sparkData = await generateSpark({
          depletedHormone,
          contextFlags,
          sparkProfile,
          usedActivities: usedActivitiesToday,
          flaggedTriggers
        })

        sparkRef.current = sparkData
        setSpark(sparkData)
        setPhase('redirecting')
        addUsedActivity(sparkData.title)

        try {
          await playVoiceMessage(sparkData.openingLine, primaryVoiceId)
        } catch (e) {
          console.warn('Voice playback failed:', e.message)
        }

        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) {
              clearInterval(timerRef.current)
              handleSurvived(sparkRef.current)
              return 0
            }
            return t - 1
          })
        }, 1000)

      } catch (err) {
        console.error('Spark generation failed:', err)
        // Show a built-in fallback spark so the interceptor always works
        const fallback = {
          title: 'One Mindful Minute',
          instruction: 'Close your eyes and take 10 slow, deep breaths — counting each one out loud as a whisper. Notice the feeling of air filling your lungs, and let every exhale carry the tension with it.',
          durationMinutes: 7,
          hormoneTarget: 'serotonin',
          category: 'mindfulness',
          openingLine: "Hey. I'm right here with you. Let's breathe through this together."
        }
        sparkRef.current = fallback
        setSpark(fallback)
        setPhase('redirecting')
        addUsedActivity(fallback.title)

        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) {
              clearInterval(timerRef.current)
              handleSurvived(sparkRef.current)
              return 0
            }
            return t - 1
          })
        }, 1000)
      }
    }

    init()
    return () => clearInterval(timerRef.current)
  }, [])

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
      if (sparkData?.category) {
        await updateSparkResonance(user.id, sparkData.category, 1)
      }
    }

    if (wallet.connected) {
      try {
        await mintMilestone(wallet, 'craving_survived', dayCount)
      } catch (e) {
        console.warn('Solana mint failed (non-critical):', e.message)
      }
    }
  }, [user, wallet, dayCount])

  const handleRelapse = () => {
    clearInterval(timerRef.current)
    setPhase('relapsed')
    resolveCraving(false)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = ((CRAVING_SECONDS - timeLeft) / CRAVING_SECONDS) * 100
  const circumference = 2 * Math.PI * 45

  return (
    <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center z-50 p-6">

      {phase === 'loading' && (
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🔥</div>
          <p className="text-amber-400 text-lg">Finding your spark...</p>
        </div>
      )}

      {phase === 'redirecting' && spark && (
        <div className="flex flex-col items-center gap-6 max-w-md w-full">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none"
                stroke="#292524" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke="#f59e0b" strokeWidth="6"
                strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-2xl font-mono font-bold">
                {fmt(timeLeft)}
              </span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full">
            <span className="text-xs text-amber-500 uppercase tracking-widest font-semibold">
              {spark.category} · {spark.hormoneTarget}
            </span>
            <h2 className="text-white text-2xl font-bold mt-2 mb-3">{spark.title}</h2>
            <p className="text-stone-300 leading-relaxed">{spark.instruction}</p>
          </div>

          <button
            onClick={handleRelapse}
            className="text-stone-500 text-sm underline underline-offset-4 hover:text-stone-300 transition-colors"
          >
            I need more help
          </button>
        </div>
      )}

      {phase === 'survived' && (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-7xl">🔥</div>
          <h2 className="text-white text-3xl font-bold">You made it.</h2>
          <p className="text-stone-400">Day {dayCount} still burning.</p>
          {wallet.connected && (
            <p className="text-amber-500 text-sm">⚡ Milestone recorded on-chain</p>
          )}
          <button
            onClick={onClose}
            className="mt-4 bg-amber-500 text-black font-semibold px-8 py-3 rounded-full hover:bg-amber-400 transition-all"
          >
            Keep going
          </button>
        </div>
      )}

      {phase === 'relapsed' && (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-7xl">🌱</div>
          <h2 className="text-white text-3xl font-bold">It's okay.</h2>
          <p className="text-stone-400">Day 1 starts now.</p>
          <p className="text-stone-500 text-sm">Every ember was once just a spark.</p>
          <button
            onClick={onClose}
            className="mt-4 bg-stone-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-stone-700 transition-all"
          >
            Start again
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="text-center flex flex-col items-center gap-4">
          <p className="text-stone-400">Something went wrong. Take a deep breath.</p>
          <p className="text-stone-500 text-sm">You have {fmt(CRAVING_SECONDS)} minutes. Just breathe.</p>
          <button onClick={onClose} className="text-amber-500 underline">Close</button>
        </div>
      )}
    </div>
  )
}

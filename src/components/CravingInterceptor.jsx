import { useState, useEffect, useCallback, useRef } from 'react'
import { useEmberStore } from '../store/emberStore'
import { generateSpark } from '../services/gemini'
import { playVoiceMessage, stopCurrentAudio } from '../services/elevenlabs'
import { mintMilestone } from '../services/solana'
import { useWallet } from '@solana/wallet-adapter-react'
import { logCravingEvent, updateSparkResonance } from '../lib/supabase'
import { TimerIcon, CheckIcon, SeedIcon, FlameIcon, MicIcon } from './Icons'
import RelapseModal from './RelapseModal'

const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const CRAVING_SECONDS = 420

const FALLBACK_SPARKS = [
  {
    title: 'Breathe Through It',
    instruction: 'Place one hand on your chest and breathe in for 4 counts, hold for 4, out for 6. Repeat slowly, feeling your heartbeat settle with each cycle.',
    durationMinutes: 7, hormoneTarget: 'serotonin', category: 'mindfulness',
    openingLine: "I'm right here with you. Let's breathe through this together, one breath at a time."
  },
  {
    title: 'Count Everything Blue',
    instruction: 'Look around your space and count every single blue object you can find. Then count again more slowly.',
    durationMinutes: 7, hormoneTarget: 'dopamine', category: 'curiosity',
    openingLine: "Let's give that restless mind somewhere new to go. Look for blue — everywhere around you."
  },
  {
    title: 'Move for 7 Minutes',
    instruction: 'Stand up and march in place, roll your shoulders back 10 times, do 10 slow arm circles each direction. Keep moving until the timer ends.',
    durationMinutes: 7, hormoneTarget: 'endorphins', category: 'movement',
    openingLine: "Your body needs to move right now. Come on, I'm so proud of you for showing up."
  },
]

export default function CravingInterceptor({ onClose }) {
  const [phase, setPhase] = useState('loading')
  const [spark, setSpark] = useState(null)
  const [timeLeft, setTimeLeft] = useState(CRAVING_SECONDS)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [lovedOneMessage, setLovedOneMessage] = useState('')
  const [companionStatus, setCompanionStatus] = useState('idle')
  const [showRelapse, setShowRelapse] = useState(false)

  const timerRef = useRef(null)
  const sparkRef = useRef(null)
  const fileRef = useRef(null)
  const companionRecRef = useRef(null)
  const phaseRef = useRef('loading')
  const userClosedRef = useRef(false)  // true only when user explicitly closes

  const { user, sparkProfile, flaggedTriggers, usedActivitiesToday,
    activeVoice, primaryVoiceId, resolveCraving, addUsedActivity,
    dayCount, sessionsCompleted, lastMoodAnalysis,
    journeyStage, pastBlockers, addEarning, stakedSOL } = useEmberStore()

  const voiceId = activeVoice?.voiceId || primaryVoiceId
  const voiceRole = activeVoice?.role || 'loved one'
  const wallet = useWallet()

  // Keep phaseRef in sync so onend callback can read it
  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    init()
    return () => {
      clearInterval(timerRef.current)
      stopSession()
    }
  }, [])

  function stopSession() {
    clearInterval(timerRef.current)
    stopCurrentAudio()
    phaseRef.current = 'closed'  // prevent onend from restarting
    const rec = companionRecRef.current
    companionRecRef.current = null
    if (rec) {
      try { rec.abort() } catch {}
      try { rec.stop() } catch {}
    }
    setCompanionStatus('idle')
  }

  // Close WITHOUT saving — streak unchanged
  const handleClose = () => {
    userClosedRef.current = true
    stopSession()
    onClose()
  }

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
        sparkData = await generateSpark({ depletedHormone, contextFlags, sparkProfile, usedActivities: usedActivitiesToday, flaggedTriggers, journeyStage, pastBlockers })
        if (!sparkData?.title) throw new Error('Bad spark')
      } catch {
        sparkData = FALLBACK_SPARKS[Math.floor(Math.random() * FALLBACK_SPARKS.length)]
      }

      sparkRef.current = sparkData
      setSpark(sparkData)
      setPhase('redirecting')
      addUsedActivity(sparkData.title)

      if (!userClosedRef.current) await playVoiceMessage(sparkData.openingLine, voiceId)
      if (!userClosedRef.current) await playVoiceMessage(sparkData.instruction, voiceId)
      if (!userClosedRef.current) startTimer()
      if (!userClosedRef.current) startCompanionListening(sparkData)
    } catch {
      const fallback = FALLBACK_SPARKS[0]
      sparkRef.current = fallback
      setSpark(fallback)
      setPhase('redirecting')
      if (!userClosedRef.current) startTimer()
      if (!userClosedRef.current) startCompanionListening(fallback)
    }
  }

  function startTimer() {
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

  // ── Always-on companion listener — ONLY active during session ─────────────
  function startCompanionListening(sparkData) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    companionRecRef.current = rec

    let parts = []
    rec.onresult = async (e) => {
      if (userClosedRef.current) return
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) parts.push(e.results[i][0].transcript)
      }
      const text = parts.join(' ').trim()
      if (text.length < 3) return
      parts = []

      stopCurrentAudio()
      setCompanionStatus('responding')

      try {
        const res = await fetch(`${BASE}/api/gemini/companion-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userText: text, role: voiceRole, dayCount, sparkTitle: sparkData?.title })
        })
        if (res.ok) {
          const data = await res.json()
          await playVoiceMessage(data.reply, voiceId)
        }
      } catch {}

      setCompanionStatus('listening')
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return
      setTimeout(() => {
        if (phaseRef.current === 'redirecting' && companionRecRef.current === rec) {
          try { rec.start() } catch {}
        }
      }, 500)
    }

    rec.onend = () => {
      if (phaseRef.current === 'redirecting' && companionRecRef.current === rec) {
        setTimeout(() => { try { rec.start() } catch {} }, 300)
      }
    }

    rec.start()
    setCompanionStatus('listening')
  }

  // ── Survived ──────────────────────────────────────────────────────────────
  const handleSurvived = useCallback(async (sparkData) => {
    stopSession()
    setPhase('survived')
    resolveCraving(true, sparkData?.category)
    if (stakedSOL > 0) addEarning()

    if (user?.id) {
      await logCravingEvent(user.id, { survived: true, spark_used: sparkData?.title, hormone_targeted: sparkData?.hormoneTarget, duration_secs: CRAVING_SECONDS })
      if (sparkData?.category) await updateSparkResonance(user.id, sparkData.category, 1)
    }

    if (wallet.connected) {
      try { await mintMilestone(wallet, 'craving_survived', dayCount) } catch {}
    }

    const nextSession = sessionsCompleted + 1
    const isMilestone = nextSession >= 5 && nextSession % 5 === 0

    if (isMilestone && voiceId) {
      try {
        const r = await fetch(`${BASE}/api/gemini/loved-one-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dayCount: dayCount + 1, sessionsCompleted: nextSession, sparkCategories: Object.keys(sparkProfile || {}) })
        })
        if (r.ok) {
          const { message } = await r.json()
          if (message) { setLovedOneMessage(message); await playVoiceMessage(message, voiceId); return }
        }
      } catch {}
    }

    try {
      await playVoiceMessage(
        `You did it. Day ${dayCount + 1}. I am so incredibly proud of you — you just proved exactly who you are.`,
        voiceId
      )
    } catch {}
  }, [user, wallet, dayCount, sessionsCompleted, voiceId, sparkProfile])

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = ((CRAVING_SECONDS - timeLeft) / CRAVING_SECONDS) * 100
  const circ = 2 * Math.PI * 45

  return (
    <>
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 p-6 overflow-y-auto"
        style={{ background: 'linear-gradient(to bottom, #1a3d28 0%, #0f2419 100%)' }}>

        {/* Always-visible close button */}
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white text-xl transition-all backdrop-blur-sm border border-white/[0.06]"
          title="Close">
          ×
        </button>

        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <FlameIcon size={48} className="text-amber-500 animate-pulse" />
            <p className="text-stone-400">Finding your spark…</p>
          </div>
        )}

        {phase === 'redirecting' && spark && (
          <div className="flex flex-col items-center gap-6 max-w-md w-full pt-8">

            {/* Timer ring */}
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1c1917" strokeWidth="5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="5"
                  strokeDasharray={`${(progress / 100) * circ} ${circ}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s linear' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-3xl font-black font-mono">{fmt(timeLeft)}</span>
                <span className="text-stone-600 text-xs">remaining</span>
              </div>
            </div>

            {/* Companion status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all
              ${companionStatus === 'listening' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                companionStatus === 'responding' ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400' :
                'bg-stone-900 border border-white/[0.06] text-stone-600'}`}>
              <MicIcon size={12} className={companionStatus === 'listening' ? 'text-emerald-400' : 'text-stone-600'} />
              {companionStatus === 'listening'
                ? `${activeVoice?.label || 'Flare'} is listening — talk to me anytime`
                : companionStatus === 'responding' ? 'Responding…' : ''}
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
                  <button onClick={() => setPhotoUrl(null)} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">Remove</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border border-white/[0.06] border-dashed rounded-xl py-3 text-stone-600 text-sm hover:border-white/20 hover:text-stone-400 transition-all flex items-center justify-center gap-2">
                  📷 Capture a moment from this activity
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files[0]; if (f) setPhotoUrl(URL.createObjectURL(f)) }} />
            </div>

            {/* I relapsed button */}
            <button
              onClick={() => { stopSession(); setShowRelapse(true) }}
              className="w-full border border-red-900/40 text-red-400 hover:bg-red-950/20 text-sm font-medium py-3 rounded-2xl transition-all">
              I relapsed
            </button>
          </div>
        )}

        {phase === 'survived' && (
          <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
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
            {photoUrl && <img src={photoUrl} alt="Activity moment" className="w-full h-44 object-cover rounded-2xl" />}
            <div className="bg-gradient-to-br from-amber-950/60 to-stone-900 border border-amber-900/30 rounded-2xl p-5 w-full text-left">
              {lovedOneMessage ? (
                <>
                  <p className="text-amber-400 text-xs uppercase tracking-widest font-semibold mb-2">
                    A message from {activeVoice?.label || 'someone who loves you'}
                  </p>
                  <p className="text-stone-200 text-sm leading-relaxed italic">"{lovedOneMessage}"</p>
                </>
              ) : (
                <p className="text-stone-300 text-sm leading-relaxed">
                  Every time you do this — every single time — you're rewiring your brain.
                  You're not just surviving a craving. You're becoming someone who does.
                </p>
              )}
            </div>
            {wallet.connected && (
              <p className="text-cyan-400 text-xs flex items-center gap-1.5">
                <CheckIcon size={14} className="text-cyan-400" /> Milestone minted on Solana devnet
              </p>
            )}
            <button onClick={onClose}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20">
              Keep the flame alive
            </button>
          </div>
        )}
      </div>

      {showRelapse && (
        <RelapseModal onClose={() => { setShowRelapse(false); onClose() }} />
      )}
    </>
  )
}

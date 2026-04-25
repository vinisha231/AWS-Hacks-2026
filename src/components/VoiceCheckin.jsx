import { useState, useRef, useEffect } from 'react'
import { playVoiceMessage } from '../services/elevenlabs'
import { useEmberStore } from '../store/emberStore'
import { MicIcon, WaveformIcon, BrainIcon } from './Icons'

const HORMONE_RESPONSES = {
  dopamine:   "I can hear the restlessness. Let's give that energy somewhere new to go.",
  serotonin:  "There's real weight in your voice. You don't have to carry it alone right now.",
  oxytocin:   "That loneliness is real. Let's find one small moment of connection.",
  endorphins: "Your body is wound tight. Let's give it somewhere to move.",
}

export default function VoiceCheckin({ onComplete, onSkip }) {
  const [phase, setPhase] = useState('intro')
  const [transcript, setTranscript] = useState('')
  const [liveText, setLiveText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [silenceTimer, setSilenceTimer] = useState(null)
  const recognitionRef = useRef(null)
  const { flaggedTriggers, setLastMoodAnalysis, primaryVoiceId } = useEmberStore()

  // Auto-stop after 3s of silence
  useEffect(() => {
    return () => {
      clearTimeout(silenceTimer)
      recognitionRef.current?.stop()
    }
  }, [])

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { onSkip(); return }

    setPhase('listening')
    setLiveText('')
    setTranscript('')

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    let finalParts = []
    let silenceId = null

    rec.onresult = e => {
      clearTimeout(silenceId)

      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalParts.push(e.results[i][0].transcript)
        else interim = e.results[i][0].transcript
      }
      setLiveText(finalParts.join(' ') + (interim ? ' ' + interim : ''))

      // Auto-submit after 3 seconds of silence
      silenceId = setTimeout(() => {
        const full = finalParts.join(' ')
        if (full.trim().length > 3) {
          setTranscript(full)
          rec.stop()
          processTranscript(full)
        }
      }, 3000)
      setSilenceTimer(silenceId)
    }

    rec.onerror = (e) => {
      if (e.error !== 'no-speech') {
        setPhase('error')
      }
    }

    rec.start()
  }

  const stopEarly = () => {
    clearTimeout(silenceTimer)
    recognitionRef.current?.stop()
    const text = liveText.trim()
    if (text.length > 3) {
      setTranscript(text)
      processTranscript(text)
    } else {
      onSkip()
    }
  }

  const processTranscript = async (text) => {
    setPhase('thinking')

    const hour = new Date().getHours()
    const timeOfDay = hour < 6 ? 'late night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

    let mood = { depletedHormone: 'serotonin', emotionalState: 'uncertain', contextFlags: {}, cravingDetected: true }

    try {
      const res = await fetch('http://localhost:3001/api/gemini/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, flaggedTriggers, timeOfDay })
      })
      if (res.ok) mood = await res.json()
    } catch (e) {
      console.warn('Mood analysis failed:', e.message)
    }

    setAnalysis(mood)
    setLastMoodAnalysis(mood)
    setPhase('done')

    const ack = HORMONE_RESPONSES[mood.depletedHormone] || "I hear you. Let's get through this together."
    try {
      await playVoiceMessage(ack, primaryVoiceId)
    } catch (e) {
      console.warn('Playback failed:', e.message)
    }

    setTimeout(() => onComplete(mood), 1800)
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/98 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
      <div className="max-w-sm w-full flex flex-col items-center gap-8 text-center">

        {phase === 'intro' && (
          <>
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <MicIcon size={40} className="text-amber-400" />
            </div>

            <div>
              <h2 className="text-white text-2xl font-bold mb-2">Tell me what's going on.</h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                Just speak naturally. Ember will detect what you're feeling and find the right activity for you.
                Stops automatically when you go quiet.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button onClick={startListening}
                className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3">
                <MicIcon size={20} className="text-black" />
                Start talking
              </button>
              <button onClick={onSkip}
                className="text-stone-600 hover:text-stone-400 text-sm transition-colors py-2">
                Skip — just give me something to do
              </button>
            </div>
          </>
        )}

        {phase === 'listening' && (
          <>
            <button onClick={stopEarly}
              className="relative w-32 h-32 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center hover:bg-red-500/15 transition-all">
              <div className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-ping" />
              <MicIcon size={44} className="text-red-400" />
            </button>

            <div>
              <p className="text-white font-semibold mb-2">I'm listening…</p>
              {liveText ? (
                <p className="text-stone-400 text-sm italic max-w-xs">"{liveText}"</p>
              ) : (
                <p className="text-stone-600 text-sm">Speak freely — stops after 3 seconds of silence</p>
              )}
            </div>
          </>
        )}

        {phase === 'thinking' && (
          <>
            <div className="w-24 h-24 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <BrainIcon size={40} className="text-violet-400 animate-pulse" />
            </div>
            {transcript && (
              <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-4 w-full text-left">
                <p className="text-stone-500 text-xs mb-1">You said</p>
                <p className="text-stone-300 text-sm italic">"{transcript}"</p>
              </div>
            )}
            <p className="text-stone-400 text-sm">Reading your emotional state…</p>
          </>
        )}

        {phase === 'done' && analysis && (
          <>
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <WaveformIcon size={40} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Got it.</p>
              <p className="text-stone-400 text-sm mt-1 capitalize">
                {analysis.emotionalState} · {analysis.depletedHormone} pathway
              </p>
            </div>
            <p className="text-stone-500 text-sm">Finding your spark…</p>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center">
              <MicIcon size={32} className="text-stone-500" />
            </div>
            <div className="flex flex-col gap-3 w-full">
              <p className="text-stone-400">Couldn't catch that. Try again?</p>
              <button onClick={startListening}
                className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl">Try again</button>
              <button onClick={onSkip}
                className="text-stone-600 text-sm hover:text-stone-400 transition-colors">Skip</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

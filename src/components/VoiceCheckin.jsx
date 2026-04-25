import { useState, useRef, useEffect } from 'react'
import { analyzeMood } from '../services/gemini'
import { playVoiceMessage } from '../services/elevenlabs'
import { useEmberStore } from '../store/emberStore'
import { MicIcon, WaveformIcon } from './Icons'

const PROMPTS = [
  "Tell me what's going on right now.",
  "What are you feeling in this moment?",
  "Just talk — I'm listening.",
  "Describe what you're experiencing.",
]

export default function VoiceCheckin({ onComplete, onSkip }) {
  const [phase, setPhase] = useState('intro')   // intro | listening | thinking | done | error
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [dots, setDots] = useState('')
  const recognitionRef = useRef(null)
  const { flaggedTriggers, setLastMoodAnalysis, primaryVoiceId } = useEmberStore()

  const prompt = PROMPTS[Math.floor(Date.now() / 86400000) % PROMPTS.length]

  useEffect(() => {
    if (phase !== 'listening' && phase !== 'thinking') return
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(iv)
  }, [phase])

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      // No speech API — go straight to skip
      onSkip()
      return
    }

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    recognitionRef.current = rec

    setPhase('listening')
    setTranscript('')

    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      setPhase('thinking')
      await processTranscript(text)
    }

    rec.onerror = (e) => {
      console.warn('Speech recognition error:', e.error)
      setPhase('error')
    }

    rec.onend = () => {
      if (phase === 'listening') setPhase('error')
    }

    rec.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
  }

  const processTranscript = async (text) => {
    try {
      const mood = await analyzeMood({ transcript: text, flaggedTriggers })
      setAnalysis(mood)
      setLastMoodAnalysis(mood)
      setPhase('done')

      // Speak a compassionate acknowledgement back
      const acknowledgements = {
        dopamine:   "I hear you — you're feeling restless. Let's channel that energy somewhere new.",
        serotonin:  "I hear the weight in that. You don't have to carry it alone right now.",
        oxytocin:   "That loneliness is real. Let's find one small moment of warmth together.",
        endorphins: "Your body is wound tight. Let's give it somewhere to go.",
      }
      const ack = acknowledgements[mood.depletedHormone] || "I hear you. I'm here. Let's get through this together."

      try {
        await playVoiceMessage(ack, primaryVoiceId)
      } catch (e) {
        console.warn('Playback failed:', e.message)
      }

      setTimeout(() => onComplete(mood), 1500)
    } catch (err) {
      console.error('Mood analysis failed:', err)
      setPhase('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/98 backdrop-blur flex flex-col items-center justify-center z-50 p-6">
      <div className="max-w-sm w-full flex flex-col items-center gap-8 text-center">

        {phase === 'intro' && (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <MicIcon size={36} className="text-amber-400" />
              </div>
              <h2 className="text-white text-2xl font-bold">Talk to Ember</h2>
              <p className="text-stone-400 leading-relaxed">
                {prompt}<br />
                <span className="text-stone-500 text-sm mt-1 block">Ember will listen, understand, and respond in a voice you love.</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={startListening}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <MicIcon size={20} className="text-black" />
                Start speaking
              </button>
              <button
                onClick={onSkip}
                className="text-stone-500 hover:text-stone-300 text-sm transition-colors py-2"
              >
                Skip — just find me something to do
              </button>
            </div>
          </>
        )}

        {phase === 'listening' && (
          <>
            <button
              onClick={stopListening}
              className="relative w-28 h-28 rounded-full bg-red-500/10 border-2 border-red-500/50 flex items-center justify-center group hover:bg-red-500/20 transition-all"
            >
              <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
              <MicIcon size={40} className="text-red-400" />
            </button>
            <div>
              <p className="text-white font-semibold text-lg">Listening{dots}</p>
              <p className="text-stone-500 text-sm mt-1">Tap the mic to stop</p>
            </div>
          </>
        )}

        {phase === 'thinking' && (
          <>
            <div className="w-28 h-28 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <WaveformIcon size={40} className="text-amber-400 animate-pulse" />
            </div>
            {transcript && (
              <div className="bg-stone-900 border border-white/5 rounded-2xl p-4 w-full">
                <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">You said</p>
                <p className="text-white text-sm italic">"{transcript}"</p>
              </div>
            )}
            <p className="text-stone-400">Reading your emotional state{dots}</p>
          </>
        )}

        {phase === 'done' && analysis && (
          <>
            <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <WaveformIcon size={40} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Got it.</p>
              <p className="text-stone-400 text-sm mt-1 capitalize">
                {analysis.emotionalState} · targeting {analysis.depletedHormone}
              </p>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
              <MicIcon size={32} className="text-stone-500" />
            </div>
            <div className="flex flex-col gap-3 w-full">
              <p className="text-stone-400">Couldn't hear that. Try again?</p>
              <button onClick={startListening} className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl">Try again</button>
              <button onClick={onSkip} className="text-stone-500 text-sm hover:text-stone-300 transition-colors">Skip</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

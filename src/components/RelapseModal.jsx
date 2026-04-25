import { useState, useEffect, useRef } from 'react'
import { useEmberStore } from '../store/emberStore'
import { playVoiceMessage, stopCurrentAudio } from '../services/elevenlabs'
import { MicIcon } from './Icons'

const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

const OPENING_LINE = "Hey — I'm still right here with you. It's okay. I need you to tell me: what happened? What caused you to relapse? Take your time. I'm listening."

export default function RelapseModal({ onClose }) {
  const { activeVoice, primaryVoiceId, flaggedTriggers, dayCount, recordRelapse } = useEmberStore()
  const voiceId = activeVoice?.voiceId || primaryVoiceId

  const [phase, setPhase] = useState('opening')   // opening | listening | thinking | response | done
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [reflection, setReflection] = useState(null)
  const [error, setError] = useState('')

  const recRef = useRef(null)
  // Speak opening line immediately on mount
  useEffect(() => {
    setPhase('opening')
    ;(async () => {
      if (voiceId) {
        try { await playVoiceMessage(OPENING_LINE, voiceId) } catch {}
      }
      setPhase('listening')
    })()
    return () => stopCurrentAudio()
  }, [])  // intentionally empty — run once on mount

  // Mic recording via SpeechRecognition
  const startMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    recRef.current = rec
    rec.onresult = e => {
      const text = e.results[0]?.[0]?.transcript || ''
      setInput(p => p ? p + ' ' + text : text)
    }
    rec.onend = () => setIsRecording(false)
    rec.onerror = () => setIsRecording(false)
    rec.start()
    setIsRecording(true)
  }

  const stopMic = () => {
    try { recRef.current?.stop() } catch {}
    setIsRecording(false)
  }

  const handleSubmit = async () => {
    if (!input.trim()) return
    setPhase('thinking')

    try {
      const res = await fetch(`${BASE}/api/gemini/relapse-reflect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userReflection: input.trim(), flaggedTriggers, dayCount })
      })
      const data = await res.json()
      setReflection(data)

      // Reset streak
      recordRelapse()

      setPhase('response')
      if (voiceId && data.response) {
        try { await playVoiceMessage(data.response, voiceId) } catch {}
      }
    } catch {
      setError('Something went wrong. Your streak has been reset. Day 1 starts now.')
      recordRelapse()
      setPhase('response')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md bg-[#111] border border-white/[0.08] rounded-3xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-white font-black text-xl">I relapsed.</h2>
            <p className="text-stone-500 text-sm">It's okay. Let's reflect together.</p>
          </div>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-300 text-2xl leading-none transition-colors">×</button>
        </div>

        <div className="p-6 flex flex-col gap-4">

          {phase === 'opening' && (
            <div className="flex items-center gap-3 text-stone-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Ember is speaking…
            </div>
          )}

          {(phase === 'listening' || phase === 'thinking') && (
            <>
              <p className="text-stone-300 text-sm leading-relaxed">
                "{OPENING_LINE}"
              </p>

              <div className="relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="What happened? You can type or use the mic…"
                  rows={4}
                  className="w-full bg-stone-900 border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder-stone-600 resize-none focus:outline-none focus:border-amber-500/40"
                />
                <button
                  onMouseDown={startMic}
                  onMouseUp={stopMic}
                  onTouchStart={startMic}
                  onTouchEnd={stopMic}
                  className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}>
                  <MicIcon size={14} />
                </button>
              </div>

              {isRecording && (
                <p className="text-red-400 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                  Listening… release to stop
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!input.trim() || phase === 'thinking'}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold py-3.5 rounded-2xl text-sm transition-all">
                {phase === 'thinking' ? 'Reflecting…' : 'Share with Ember →'}
              </button>
            </>
          )}

          {phase === 'response' && (
            <div className="flex flex-col gap-4">
              {error ? (
                <p className="text-stone-300 text-sm leading-relaxed">{error}</p>
              ) : reflection ? (
                <>
                  <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-stone-200 text-sm leading-relaxed">{reflection.response}</p>
                  </div>

                  {reflection.strategies?.length > 0 && (
                    <div>
                      <p className="text-stone-500 text-xs uppercase tracking-widest mb-2">For next time</p>
                      <ul className="flex flex-col gap-2">
                        {reflection.strategies.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-stone-300 text-sm">
                            <span className="text-amber-400 mt-0.5">→</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}

              <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-2xl p-4 text-center">
                <p className="text-emerald-400 font-bold text-lg">Day 1 starts now.</p>
                <p className="text-stone-400 text-xs mt-1">Your streak has been reset. Every comeback starts here.</p>
              </div>

              <button onClick={onClose}
                className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all">
                I'm ready to start again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

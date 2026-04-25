import { useState, useRef, useEffect } from 'react'
import { playVoiceMessage } from '../services/elevenlabs'
import { saveCheckin, getCheckins } from '../services/voiceStorage'
import { useEmberStore } from '../store/emberStore'
import { MicIcon, WaveformIcon, CheckIcon } from './Icons'

const PROMPTS = [
  "Hey — how are you doing today?",
  "Check in with yourself. How's today feeling?",
  "Tell Flare how you're doing right now.",
  "What's on your mind today?",
]

export default function DailyCheckin() {
  const [phase, setPhase] = useState('idle')
  const [checkins, setCheckins] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const recognitionRef = useRef(null)
  const [transcript, setTranscript] = useState('')
  const { primaryVoiceId, flaggedTriggers, journeyStage, pastBlockers } = useEmberStore()

  const todayPrompt = PROMPTS[new Date().getDay() % PROMPTS.length]

  useEffect(() => {
    getCheckins().then(all => setCheckins(all))
  }, [])

  const startRecording = async () => {
    setPhase('recording')
    setTranscript('')
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = { recorder: mr, stream }
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.start()
    } catch {}

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      const rec = new SR()
      rec.continuous = true
      rec.interimResults = false
      rec.lang = 'en-US'
      recognitionRef.current = rec
      let parts = []
      rec.onresult = e => {
        for (let i = e.resultIndex; i < e.results.length; i++) parts.push(e.results[i][0].transcript)
        setTranscript(parts.join(' '))
      }
      rec.start()
    }
  }

  const stopRecording = async () => {
    setPhase('thinking')
    recognitionRef.current?.stop()

    let audioBlob = null
    if (mediaRef.current) {
      const { recorder, stream } = mediaRef.current
      audioBlob = await new Promise(resolve => {
        recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: 'audio/webm' }))
        recorder.stop()
        stream.getTracks().forEach(t => t.stop())
      })
    }

    const text = transcript || 'I checked in today.'
    let analysis = { mood: 'checked in', response: "Thank you for checking in. Every day you show up counts.", affirmation: "You're doing better than you think." }
    try {
      const res = await fetch('http://localhost:3001/api/gemini/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, flaggedTriggers, journeyStage, pastBlockers })
      })
      if (res.ok) analysis = await res.json()
    } catch {}

    const entry = { audioBlob, transcript: text, mood: analysis.mood, response: analysis.response, affirmation: analysis.affirmation, riskScore: analysis.riskScore || 0 }
    await saveCheckin(entry)
    try { await playVoiceMessage(analysis.response, primaryVoiceId) } catch {}

    const updated = await getCheckins()
    setCheckins(updated)
    setPhase('done')
    setTimeout(() => setPhase('idle'), 3000)
  }

  const todayEntry = checkins.find(c => new Date(c.ts).toDateString() === new Date().toDateString())

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-stone-400 text-xs uppercase tracking-widest font-medium">Daily check-in</p>
          {todayEntry && (
            <p className="text-emerald-600 text-xs mt-0.5 flex items-center gap-1">
              <CheckIcon size={12} /> Done today · {todayEntry.mood}
            </p>
          )}
        </div>
        {checkins.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)}
            className="text-stone-400 hover:text-stone-600 text-xs transition-colors">
            {showHistory ? 'Hide' : `History (${checkins.length})`}
          </button>
        )}
      </div>

      {phase === 'idle' && !todayEntry && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-stone-900 text-sm font-semibold">{todayPrompt}</p>
            <p className="text-stone-400 text-xs mt-0.5">Tap and speak — Flare will respond</p>
          </div>
          <button onClick={startRecording}
            className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-all active:scale-95 shrink-0">
            <MicIcon size={20} className="text-amber-500" />
          </button>
        </div>
      )}

      {phase === 'idle' && todayEntry && (
        <div>
          <p className="text-stone-800 text-sm italic leading-relaxed mb-1">"{todayEntry.response}"</p>
          <p className="text-amber-600 text-xs font-semibold">{todayEntry.affirmation}</p>
        </div>
      )}

      {phase === 'recording' && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-stone-800 text-sm font-medium">Listening…</p>
            </div>
            {transcript && <p className="text-stone-500 text-xs italic truncate">"{transcript}"</p>}
          </div>
          <button onClick={stopRecording}
            className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-all shrink-0">
            <div className="w-4 h-4 rounded-sm bg-red-400" />
          </button>
        </div>
      )}

      {phase === 'thinking' && (
        <div className="flex items-center gap-3">
          <WaveformIcon size={20} className="text-amber-400 animate-pulse" />
          <p className="text-stone-500 text-sm">Flare is listening…</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex items-center gap-3">
          <CheckIcon size={20} className="text-emerald-500" />
          <p className="text-emerald-600 text-sm font-medium">Check-in saved</p>
        </div>
      )}

      {showHistory && checkins.length > 0 && (
        <div className="mt-4 border-t border-stone-100 divide-y divide-stone-100 max-h-72 overflow-y-auto">
          {checkins.map((c, i) => {
            const d = new Date(c.ts)
            const isToday = d.toDateString() === new Date().toDateString()
            const audioUrl = c.audioBlob ? URL.createObjectURL(c.audioBlob) : null
            return (
              <div key={i} className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-stone-600 text-xs font-medium">
                      {isToday ? 'Today' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {c.mood && <span className="text-stone-400 text-xs">· {c.mood}</span>}
                  </div>
                  {c.transcript && <p className="text-stone-400 text-xs italic truncate">"{c.transcript}"</p>}
                  {c.affirmation && <p className="text-amber-500/80 text-xs mt-0.5">{c.affirmation}</p>}
                </div>
                {audioUrl && <audio src={audioUrl} controls className="h-7 shrink-0" style={{ width: 80 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

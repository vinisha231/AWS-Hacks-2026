import { useState, useRef } from 'react'
import { useEmberStore } from '../store/emberStore'
import { cloneVoice } from '../services/elevenlabs'

const INTERESTS = [
  { label: 'Drawing',      emoji: '✏️' }, { label: 'Music',        emoji: '🎵' },
  { label: 'Cooking',      emoji: '🍳' }, { label: 'Gardening',    emoji: '🌱' },
  { label: 'Photography',  emoji: '📷' }, { label: 'Writing',      emoji: '✍️' },
  { label: 'Puzzles',      emoji: '🧩' }, { label: 'Coding',       emoji: '💻' },
  { label: 'Astronomy',    emoji: '🔭' }, { label: 'Chess',        emoji: '♟️' },
  { label: 'Languages',    emoji: '🌍' }, { label: 'Magic tricks', emoji: '🪄' },
  { label: 'Origami',      emoji: '🦢' }, { label: 'Hiking',       emoji: '🥾' },
  { label: 'Reading',      emoji: '📚' }, { label: 'Poetry',       emoji: '📜' },
]

const ADDICTION_OPTIONS = [
  { label: 'Nicotine',     emoji: '🚬' }, { label: 'Alcohol',      emoji: '🍺' },
  { label: 'Cannabis',     emoji: '🌿' }, { label: 'Gambling',     emoji: '🎰' },
  { label: 'Social media', emoji: '📱' }, { label: 'Gaming',       emoji: '🎮' },
  { label: 'Opioids',      emoji: '💊' }, { label: 'Food',         emoji: '🍔' },
  { label: 'Shopping',     emoji: '🛍️' }, { label: 'Other',        emoji: '•'  },
]

const VOICE_ROLES = [
  { role: 'mother',   label: 'Mom',     emoji: '👩' },
  { role: 'father',   label: 'Dad',     emoji: '👨' },
  { role: 'daughter', label: 'Daughter',emoji: '👧' },
  { role: 'son',      label: 'Son',     emoji: '👦' },
  { role: 'sponsor',  label: 'Sponsor', emoji: '🤝' },
  { role: 'friend',   label: 'Friend',  emoji: '🫂' },
]

export default function ProfileSetupModal() {
  const { completeProfileSetup, addVoice, setActiveVoice } = useEmberStore()
  const [step, setStep] = useState(0)
  const [addictions, setAddictions] = useState([])
  const [interests, setInterests] = useState([])

  // Voice clone state
  const [selectedRole, setSelectedRole] = useState(null)
  const [personName, setPersonName] = useState('')
  const [recording, setRecording] = useState(false)
  const [cloning, setCloning] = useState(false)
  const [cloned, setCloned] = useState(false)
  const [cloneError, setCloneError] = useState('')
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const toggle = (list, setList, val) =>
    setList(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val])

  const startRecording = async () => {
    setCloneError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.start()
      mediaRef.current = { recorder: mr, stream }
      setRecording(true)
    } catch {
      setCloneError('Microphone access denied.')
    }
  }

  const stopAndClone = async () => {
    if (!personName.trim()) { setCloneError('Enter their name first.'); return }
    setRecording(false)
    setCloning(true)
    const { recorder, stream } = mediaRef.current
    const blob = await new Promise(resolve => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: 'audio/webm' }))
      recorder.stop()
      stream.getTracks().forEach(t => t.stop())
    })
    try {
      const { voiceId } = await cloneVoice(personName.trim(), blob)
      const voice = { id: `clone_${Date.now()}`, label: personName.trim(), voiceId, role: selectedRole, isClone: true }
      addVoice(voice)
      setActiveVoice(voice)
      setCloned(true)
    } catch {
      setCloneError('Clone failed — try a longer recording (10+ seconds).')
    }
    setCloning(false)
  }

  const finish = () => completeProfileSetup(interests, addictions)

  const progressWidth = step === 0 ? '33%' : step === 1 ? '66%' : '100%'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(247,243,236,0.95)', backdropFilter: 'blur(8px)' }}>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-stone-200/80 border border-stone-100 overflow-hidden animate-slide-up"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="h-1 bg-stone-100 sticky top-0 z-10">
          <div className="h-1 bg-amber-400 transition-all duration-500" style={{ width: progressWidth }} />
        </div>

        <div className="p-8">

          {/* ── Step 1: What are you working on? ── */}
          {step === 0 && (
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-semibold mb-2">Step 1 of 3</p>
              <h2 className="text-2xl font-black text-stone-900 mb-1">What are you working on?</h2>
              <p className="text-stone-400 text-sm mb-6">No judgment. This helps Flare show up right for you.</p>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {ADDICTION_OPTIONS.map(({ label, emoji }) => (
                  <button key={label} onClick={() => toggle(addictions, setAddictions, label)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-medium transition-all text-left
                      ${addictions.includes(label) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} disabled={addictions.length === 0}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-30 text-black font-bold py-4 rounded-2xl transition-all text-sm">
                Next →
              </button>
            </div>
          )}

          {/* ── Step 2: What do you love? ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-semibold mb-2">Step 2 of 3</p>
              <h2 className="text-2xl font-black text-stone-900 mb-1">What do you love?</h2>
              <p className="text-stone-400 text-sm mb-6">These become your Spark activities and float around your home screen.</p>
              <div className="grid grid-cols-3 gap-2 mb-8">
                {INTERESTS.map(({ label, emoji }) => (
                  <button key={label} onClick={() => toggle(interests, setInterests, label)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border text-xs font-medium transition-all
                      ${interests.includes(label) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                    <span className="text-xl">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)}
                  className="px-5 py-4 rounded-2xl border border-stone-200 text-stone-500 text-sm font-medium hover:border-stone-300">←</button>
                <button onClick={() => setStep(2)} disabled={interests.length === 0}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-30 text-black font-bold py-4 rounded-2xl transition-all text-sm">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Clone a voice ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-semibold mb-2">Step 3 of 3</p>
              <h2 className="text-2xl font-black text-stone-900 mb-1">Clone someone's voice</h2>
              <p className="text-stone-400 text-sm mb-6">
                Have someone you love say a few sentences — Flare will speak in their actual voice during hard moments.
              </p>

              {!cloned ? (
                <>
                  {/* Who is it? */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {VOICE_ROLES.map(({ role, label, emoji }) => (
                      <button key={role} onClick={() => setSelectedRole(role)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl border text-xs font-medium transition-all
                          ${selectedRole === role ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                        <span className="text-xl">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Name input */}
                  <input value={personName} onChange={e => setPersonName(e.target.value)}
                    placeholder="Their name (e.g. Mom)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400 mb-4" />

                  {/* Recording */}
                  {!recording ? (
                    <button onClick={startRecording} disabled={cloning || !selectedRole}
                      className="w-full flex items-center justify-center gap-2 border border-stone-200 hover:border-amber-400 rounded-2xl py-4 text-stone-600 text-sm hover:text-amber-700 transition-all disabled:opacity-40">
                      🎙️ {cloning ? 'Cloning voice…' : 'Record their voice'}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-red-500 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Recording… ask them to speak for 10–30 seconds
                      </div>
                      <button onClick={stopAndClone}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3.5 rounded-2xl text-sm transition-all">
                        Done — clone this voice ✓
                      </button>
                    </div>
                  )}

                  {cloneError && <p className="text-red-400 text-xs mt-3">{cloneError}</p>}

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(1)}
                      className="px-5 py-4 rounded-2xl border border-stone-200 text-stone-500 text-sm font-medium hover:border-stone-300">←</button>
                    <button onClick={finish}
                      className="flex-1 border border-stone-200 text-stone-500 hover:text-stone-700 font-medium py-4 rounded-2xl text-sm transition-all">
                      Skip — use a preset voice
                    </button>
                  </div>
                </>
              ) : (
                /* Clone success */
                <div className="flex flex-col items-center gap-5 text-center py-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-4xl">
                    🎙️
                  </div>
                  <div>
                    <h3 className="text-stone-900 font-black text-xl mb-1">{personName}'s voice is ready.</h3>
                    <p className="text-stone-400 text-sm leading-relaxed">
                      Flare will speak in their voice every time you need support.
                    </p>
                  </div>
                  <button onClick={finish}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 rounded-2xl transition-all text-sm">
                    Let's go ✨
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

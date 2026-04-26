import { useState, useRef } from 'react'
import { useEmberStore, PRESET_VOICES } from '../store/emberStore'
import { playVoiceMessage, cloneVoice } from '../services/elevenlabs'
import { CheckIcon, MicIcon } from './Icons'

export default function VoicePicker() {
  const { voices, activeVoice, setActiveVoice, addVoice, removeVoice } = useEmberStore()
  const [previewing, setPreviewing] = useState(null)
  const [recording, setRecording] = useState(false)
  const [cloneName, setCloneName] = useState('')
  const [cloneRelation, setCloneRelation] = useState('custom')
  const [cloning, setCloning] = useState(false)
  const [error, setError] = useState('')
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const allVoices = [...PRESET_VOICES, ...voices.filter(v => v.isClone)]

  const handlePreview = async (e, voice) => {
    e.stopPropagation()
    if (previewing === voice.id) return
    setPreviewing(voice.id)
    try {
      await playVoiceMessage(
        "Hey, I'm here with you. You've got this — one moment at a time.",
        voice.voiceId
      )
    } catch { /* silent */ }
    setPreviewing(null)
  }

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.start()
      mediaRef.current = { recorder: mr, stream }
      setRecording(true)
    } catch {
      setError('Microphone access denied.')
    }
  }

  const stopAndClone = async () => {
    if (!cloneName.trim()) { setError('Enter the person\'s name first.'); return }
    setRecording(false)
    setCloning(true)
    setError('')

    const { recorder, stream } = mediaRef.current
    const blob = await new Promise(resolve => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: 'audio/webm' }))
      recorder.stop()
      stream.getTracks().forEach(t => t.stop())
    })

    try {
      const { voiceId } = await cloneVoice(cloneName.trim(), blob)
      const newVoice = {
        id: `clone_${Date.now()}`,
        label: cloneName.trim(),
        voiceId,
        role: cloneRelation,
        emoji: '🎙️',
        isClone: true,
      }
      addVoice(newVoice)
      setActiveVoice(newVoice)
      setCloneName('')
      setCloneRelation('custom')
    } catch (e) {
      setError(e.message?.includes('401') || e.message?.includes('403')
        ? 'API key issue — check your ElevenLabs account.'
        : e.message?.includes('422') || e.message?.includes('400')
          ? 'Recording too short — record at least 30 seconds of clear speech.'
          : `Clone failed: ${e.message}`)
    }
    setCloning(false)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Voice grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {allVoices.map(voice => {
          const isActive  = activeVoice?.id === voice.id
          const isLoading = previewing === voice.id
          return (
            <button key={voice.id}
              onClick={() => setActiveVoice(isActive ? null : voice)}
              className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-2xl border text-left transition-all
                ${isActive ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>

              {isActive && (
                <span className="absolute top-2.5 right-2.5">
                  <CheckIcon size={13} className="text-amber-500" />
                </span>
              )}

              <span className="text-2xl">{voice.emoji || '🎙️'}</span>
              <div>
                <p className={`text-sm font-bold leading-tight ${isActive ? 'text-amber-800' : 'text-stone-800'}`}>
                  {voice.label}
                </p>
                <p className={`text-xs mt-0.5 ${isActive ? 'text-amber-600' : 'text-stone-400'}`}>
                  {voice.role}{voice.isClone ? ' · cloned' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button onClick={e => handlePreview(e, voice)} disabled={isLoading}
                  className={`text-xs font-medium transition-colors
                    ${isLoading ? 'text-amber-500 animate-pulse' : isActive ? 'text-amber-500 hover:text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>
                  {isLoading ? '▶ playing…' : '▶ preview'}
                </button>
                {voice.isClone && (
                  <button onClick={e => { e.stopPropagation(); removeVoice(voice.id) }}
                    className="text-xs text-stone-300 hover:text-red-400 transition-colors ml-auto">
                    ✕
                  </button>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Active voice badge */}
      {activeVoice && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-xl">{activeVoice.emoji || '🎙️'}</span>
          <p className="text-amber-800 text-sm">
            Flare will speak as <span className="font-bold">{activeVoice.label}</span> — {activeVoice.role}.
          </p>
        </div>
      )}

      {/* Clone a real voice */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-stone-800 font-semibold text-sm mb-0.5">Clone a real voice</p>
          <p className="text-stone-400 text-xs">
            Have your mom, sponsor, or anyone say a few sentences — Flare will speak in their actual voice.
          </p>
        </div>

        <div className="flex gap-2">
          <input value={cloneName} onChange={e => setCloneName(e.target.value)}
            placeholder="Their name (e.g. Mom)"
            className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400" />
          <select value={cloneRelation} onChange={e => setCloneRelation(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-amber-400">
            <option value="mother">Mother</option>
            <option value="father">Father</option>
            <option value="daughter">Daughter</option>
            <option value="son">Son</option>
            <option value="sponsor">Sponsor</option>
            <option value="friend">Friend</option>
            <option value="custom">Other</option>
          </select>
        </div>

        {!recording ? (
          <button onClick={startRecording}
            disabled={cloning || voices.filter(v => v.isClone).length >= 10}
            className="w-full flex items-center justify-center gap-2 bg-white border border-stone-200 hover:border-amber-400 hover:text-amber-600 rounded-xl py-3 text-stone-500 text-sm font-medium transition-all disabled:opacity-40">
            <MicIcon size={15} />
            {cloning ? 'Cloning voice…' : voices.filter(v => v.isClone).length >= 10 ? 'Max 10 voices reached' : 'Record their voice'}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording… ask them to speak naturally for 30+ seconds
            </div>
            <button onClick={stopAndClone}
              className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 rounded-xl text-sm transition-all">
              Done — clone this voice
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}
        <p className="text-stone-300 text-xs">{voices.filter(v => v.isClone).length}/10 cloned voices used</p>
      </div>
    </div>
  )
}

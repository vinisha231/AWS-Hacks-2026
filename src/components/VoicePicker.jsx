import { useState, useRef } from 'react'
import { useEmberStore, PRESET_VOICES } from '../store/emberStore'
import { cloneVoice } from '../services/elevenlabs'
import { MicIcon, CheckIcon, WaveformIcon } from './Icons'

export default function VoicePicker() {
  const { voices, activeVoice, setActiveVoice, addVoice, removeVoice } = useEmberStore()
  const [recording, setRecording] = useState(false)
  const [cloneName, setCloneName] = useState('')
  const [cloneRelation, setCloneRelation] = useState('custom')
  const [cloning, setCloning] = useState(false)
  const [error, setError] = useState('')
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const allVoices = [
    ...PRESET_VOICES,
    ...voices.filter(v => v.isClone)
  ]

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
        isClone: true
      }
      addVoice(newVoice)
      setActiveVoice(newVoice)
      setCloneName('')
      setCloneRelation('custom')
    } catch (e) {
      setError('Voice clone failed. Try a longer recording (10+ seconds).')
    }
    setCloning(false)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Voice grid */}
      <div className="grid grid-cols-2 gap-2">
        {allVoices.map(voice => {
          const isActive = activeVoice?.id === voice.id
          return (
            <button key={voice.id}
              onClick={() => setActiveVoice(isActive ? null : voice)}
              className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left
                ${isActive
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-white/[0.08] hover:border-white/20 bg-stone-900'}`}>
              {isActive && (
                <span className="absolute top-2 right-2">
                  <CheckIcon size={14} className="text-amber-400" />
                </span>
              )}
              <span className="text-white text-sm font-semibold">{voice.label}</span>
              <span className={`text-xs capitalize ${isActive ? 'text-amber-400' : 'text-stone-500'}`}>
                {voice.role} {voice.isClone ? '· cloned' : '· preset'}
              </span>
              {voice.isClone && (
                <button
                  onClick={e => { e.stopPropagation(); removeVoice(voice.id) }}
                  className="text-stone-700 hover:text-red-400 text-xs mt-1 transition-colors">
                  Remove
                </button>
              )}
            </button>
          )
        })}
      </div>

      {activeVoice && (
        <div className="flex items-center gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5">
          <WaveformIcon size={16} className="text-amber-400" />
          <p className="text-amber-300 text-sm">
            Ember will speak as <span className="font-semibold">{activeVoice.label}</span> — warm, proud, always in your corner.
          </p>
        </div>
      )}

      {/* Clone a real voice */}
      <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-white font-semibold text-sm mb-0.5">Clone a real voice</p>
          <p className="text-stone-500 text-xs">Have your mom, sponsor, or anyone say a few sentences — Ember will speak in their actual voice. Up to 10 voices free.</p>
        </div>

        <div className="flex gap-2">
          <input value={cloneName} onChange={e => setCloneName(e.target.value)}
            placeholder="Their name (e.g. Mom)"
            className="flex-1 bg-stone-800 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/40" />
          <select value={cloneRelation} onChange={e => setCloneRelation(e.target.value)}
            className="bg-stone-800 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
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
          <button onClick={startRecording} disabled={cloning || voices.filter(v => v.isClone).length >= 10}
            className="w-full flex items-center justify-center gap-2 border border-white/[0.08] hover:border-amber-500/40 rounded-xl py-3 text-stone-300 text-sm hover:text-amber-300 transition-all disabled:opacity-40">
            <MicIcon size={16} />
            {cloning ? 'Cloning voice…' : voices.filter(v => v.isClone).length >= 10 ? 'Max 10 voices reached' : 'Record their voice'}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording… ask them to speak naturally for 10–30 seconds
            </div>
            <button onClick={stopAndClone}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-sm transition-all">
              Done — clone this voice
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
        <p className="text-stone-700 text-xs">{voices.filter(v => v.isClone).length}/10 cloned voices used</p>
      </div>
    </div>
  )
}

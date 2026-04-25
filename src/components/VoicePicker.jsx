import { useState } from 'react'
import { useEmberStore, PRESET_VOICES } from '../store/emberStore'
import { playVoiceMessage } from '../services/elevenlabs'
import { CheckIcon } from './Icons'

export default function VoicePicker() {
  const { voices, activeVoice, setActiveVoice } = useEmberStore()
  const [previewing, setPreviewing] = useState(null)

  const allVoices = [
    ...PRESET_VOICES,
    ...voices.filter(v => v.isClone),
  ]

  const handlePreview = async (e, voice) => {
    e.stopPropagation()
    if (previewing === voice.id) return
    setPreviewing(voice.id)
    try {
      await playVoiceMessage(
        "Hey, I'm here with you. You've got this — one moment at a time.",
        voice.voiceId
      )
    } catch { /* silent fail */ }
    setPreviewing(null)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Voice grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {allVoices.map(voice => {
          const isActive   = activeVoice?.id === voice.id
          const isLoading  = previewing === voice.id
          return (
            <button key={voice.id}
              onClick={() => setActiveVoice(isActive ? null : voice)}
              className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-2xl border text-left transition-all
                ${isActive
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-stone-200 hover:border-stone-300 bg-white'}`}>

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
                <p className={`text-xs mt-0.5 leading-tight ${isActive ? 'text-amber-600' : 'text-stone-400'}`}>
                  {voice.role}
                </p>
              </div>

              <button
                onClick={e => handlePreview(e, voice)}
                disabled={isLoading}
                className={`text-xs font-medium mt-0.5 transition-colors
                  ${isLoading
                    ? 'text-amber-500 animate-pulse'
                    : isActive
                      ? 'text-amber-500 hover:text-amber-700'
                      : 'text-stone-400 hover:text-stone-600'}`}>
                {isLoading ? '▶ playing…' : '▶ preview'}
              </button>
            </button>
          )
        })}
      </div>

      {/* Active voice confirmation */}
      {activeVoice && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-xl">{activeVoice.emoji || '🎙️'}</span>
          <p className="text-amber-800 text-sm">
            Flare will speak as <span className="font-bold">{activeVoice.label}</span> — {activeVoice.role}.
          </p>
        </div>
      )}

      {/* Cloning — locked (requires Creator plan) */}
      <div className="relative rounded-2xl border border-stone-200 bg-stone-50 p-5 overflow-hidden">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
          <span className="text-3xl">🔒</span>
          <p className="text-stone-800 font-bold text-sm">Voice cloning — Creator plan</p>
          <p className="text-stone-500 text-xs text-center max-w-[200px]">
            Upgrade your ElevenLabs account to clone a real voice — your mom, sponsor, anyone.
          </p>
          <a
            href="https://elevenlabs.io/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold transition-all">
            View plans →
          </a>
        </div>

        {/* Blurred background UI */}
        <div className="opacity-40 pointer-events-none select-none">
          <p className="text-stone-700 font-semibold text-sm mb-1">Clone a real voice</p>
          <p className="text-stone-400 text-xs mb-3">Record a loved one — Flare speaks in their actual voice.</p>
          <div className="h-9 bg-stone-200 rounded-xl mb-2" />
          <div className="h-9 bg-stone-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

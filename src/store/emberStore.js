import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Built-in ElevenLabs pre-made voices — free on all plans
export const PRESET_VOICES = [
  { id: 'preset_mother',   label: 'Mother',   voiceId: 'pFZP5JQG7iQjIQuC4Bku', role: 'mother'   },
  { id: 'preset_father',   label: 'Father',   voiceId: 'VR6AewLTigWG4xSOukaG', role: 'father'   },
  { id: 'preset_daughter', label: 'Daughter', voiceId: 'MF3mGyEYCl7XYWbV9V6O', role: 'daughter' },
  { id: 'preset_son',      label: 'Son',      voiceId: 'TxGEqnHWrfWFTfGW9XjX', role: 'son'      },
]

export const useEmberStore = create(
  persist(
    (set, get) => ({
      user: null,
      dayCount: 0,
      sessionsCompleted: 0,
      sparkProfile: {},
      flaggedTriggers: [],
      usedActivitiesToday: [],
      userInterests: [],       // from profile setup
      userAddictions: [],      // from profile setup
      profileSetupDone: false,
      journeyStage: null,      // 'starting' | 'tried_before' | 'been_at_it' | 'relapsed_restart'
      pastBlockers: [],        // e.g. ['Stress', 'Boredom', 'Social pressure']
      loginDays: [],           // ['2026-04-25', ...] days user opened the app
      // Voice system
      voices: [],           // [{ id, label, voiceId, role, isClone }]
      activeVoice: null,    // the currently selected voice object
      // Legacy single voiceId kept for back-compat
      primaryVoiceId: null,
      walletAddress: null,
      cravingActive: false,
      cravingStartTime: null,
      lastMoodAnalysis: null,

      setUser: (user) => set({ user }),
      setUserInterests: (interests) => set({ userInterests: interests }),
      setUserAddictions: (addictions) => set({ userAddictions: addictions }),
      completeProfileSetup: (interests, addictions) => set({ userInterests: interests, userAddictions: addictions, profileSetupDone: true }),
      setJourneyProfile: (journeyStage, pastBlockers) => set({ journeyStage, pastBlockers }),

      recordLogin: () => set(state => {
        const today = new Date().toISOString().split('T')[0]
        if (state.loginDays.includes(today)) return {}
        return { loginDays: [...state.loginDays, today] }
      }),

      recordRelapse: () => set({ dayCount: 0, cravingActive: false, cravingStartTime: null }),
      setVoiceId: (id) => set({ primaryVoiceId: id }),
      setWallet: (addr) => set({ walletAddress: addr }),
      setSparkProfile: (profile) => set({ sparkProfile: profile }),
      setFlaggedTriggers: (triggers) => set({ flaggedTriggers: triggers }),

      setActiveVoice: (voice) => set({ activeVoice: voice, primaryVoiceId: voice?.voiceId || null }),

      addVoice: (voice) => set(state => {
        const voices = state.voices.filter(v => v.id !== voice.id)
        return { voices: [...voices, voice].slice(-10) } // max 10
      }),

      removeVoice: (id) => set(state => ({
        voices: state.voices.filter(v => v.id !== id),
        activeVoice: state.activeVoice?.id === id ? null : state.activeVoice
      })),

      activateCraving: () => set({ cravingActive: true, cravingStartTime: Date.now() }),

      resolveCraving: (survived, sparkCategory) => set(state => ({
        cravingActive: false,
        cravingStartTime: null,
        dayCount: survived ? state.dayCount + 1 : 0,
        sessionsCompleted: survived ? state.sessionsCompleted + 1 : state.sessionsCompleted,
        sparkProfile: survived && sparkCategory ? {
          ...state.sparkProfile,
          [sparkCategory]: (state.sparkProfile[sparkCategory] || 0) + 1
        } : state.sparkProfile
      })),

      addFlaggedTrigger: (topic) => set(state => ({
        flaggedTriggers: [...new Set([...state.flaggedTriggers, topic])]
      })),

      addUsedActivity: (title) => set(state => ({
        usedActivitiesToday: [...state.usedActivitiesToday, title]
      })),

      setLastMoodAnalysis: (analysis) => set({ lastMoodAnalysis: analysis }),
    }),
    { name: 'ember-v3' }
  )
)

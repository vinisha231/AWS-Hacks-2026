import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Built-in ElevenLabs pre-made voices — free on all plans
export const PRESET_VOICES = [
  { id: 'preset_rachel',  label: 'Rachel',  voiceId: '21m00Tcm4TlvDq8ikWAM', role: 'warm & calm',       emoji: '🌸' },
  { id: 'preset_bella',   label: 'Bella',   voiceId: 'EXAVITQu4vr4xnSDxMaL', role: 'soft & gentle',     emoji: '✨' },
  { id: 'preset_elli',    label: 'Elli',    voiceId: 'MF3mGyEYCl7XYWbV9V6O', role: 'bright & caring',   emoji: '💛' },
  { id: 'preset_domi',    label: 'Domi',    voiceId: 'AZnzlk1XvdvUeBnXmlld', role: 'strong & clear',    emoji: '🔥' },
  { id: 'preset_josh',    label: 'Josh',    voiceId: 'TxGEqnHWrfWFTfGW9XjX', role: 'deep & steady',     emoji: '🏔️' },
  { id: 'preset_adam',    label: 'Adam',    voiceId: 'pNInz6obpgDQGcFmaJgB', role: 'grounded & firm',   emoji: '🌿' },
  { id: 'preset_arnold',  label: 'Arnold',  voiceId: 'VR6AewLTigWG4xSOukaG', role: 'powerful & assured',emoji: '⚡' },
  { id: 'preset_sam',     label: 'Sam',     voiceId: 'yoZ06aMxZJJ28mfd3POQ', role: 'warm & encouraging',emoji: '🌟' },
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
      goals: [],               // [{ id, text, done, createdAt }]
      profileSetupDone: false,
      journeyStage: null,      // 'starting' | 'tried_before' | 'been_at_it' | 'relapsed_restart'
      pastBlockers: [],        // e.g. ['Stress', 'Boredom', 'Social pressure']
      // Recovery stake
      stakedSOL: 0,            // total SOL deposited to vault
      rewardPerSession: 0,     // SOL earned back per session survived
      earnedSOL: 0,            // total SOL earned back so far
      stakeDepositSig: null,   // on-chain tx signature of deposit
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
      addGoal:    (text) => set(s => ({ goals: [...s.goals, { id: Date.now(), text, done: false, createdAt: Date.now() }] })),
      toggleGoal: (id)   => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) })),
      editGoal:   (id, text) => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, text } : g) })),
      deleteGoal: (id)   => set(s => ({ goals: s.goals.filter(g => g.id !== id) })),
      setUserAddictions: (addictions) => set({ userAddictions: addictions }),
      completeProfileSetup: (interests, addictions) => set({ userInterests: interests, userAddictions: addictions, profileSetupDone: true }),
      setJourneyProfile: (journeyStage, pastBlockers) => set({ journeyStage, pastBlockers }),
      setStake: (stakedSOL, rewardPerSession, stakeDepositSig) =>
        set({ stakedSOL, rewardPerSession, stakeDepositSig, earnedSOL: 0 }),
      addEarning: () => set(state => ({
        earnedSOL: Math.min(state.stakedSOL, +(state.earnedSOL + state.rewardPerSession).toFixed(6))
      })),

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

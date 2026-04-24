import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useEmberStore = create(
  persist(
    (set, get) => ({
      user: null,
      dayCount: 0,
      sparkProfile: {},
      flaggedTriggers: [],
      usedActivitiesToday: [],
      primaryVoiceId: null,
      walletAddress: null,
      cravingActive: false,
      cravingStartTime: null,
      lastMoodAnalysis: null,

      setUser: (user) => set({ user }),
      setVoiceId: (id) => set({ primaryVoiceId: id }),
      setWallet: (addr) => set({ walletAddress: addr }),
      setSparkProfile: (profile) => set({ sparkProfile: profile }),
      setFlaggedTriggers: (triggers) => set({ flaggedTriggers: triggers }),

      activateCraving: () => set({
        cravingActive: true,
        cravingStartTime: Date.now()
      }),

      resolveCraving: (survived, sparkCategory) => set(state => ({
        cravingActive: false,
        cravingStartTime: null,
        dayCount: survived ? state.dayCount + 1 : 0,
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
    { name: 'ember-v1' }
  )
)

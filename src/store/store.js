import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(persist(
  (set) => ({
    // Language
    language: 'en',
    setLanguage: (lang) => set({ language: lang }),

    // Intake answers
    answers: {},
    setAnswer: (key, value) => set(state => ({ answers: { ...state.answers, [key]: value } })),
    clearAnswers: () => set({ answers: {} }),

    // Eligibility results
    results: null,
    setResults: (results) => set({ results }),
    clearResults: () => set({ results: null }),

    // Application status tracker
    tracker: {},
    setTrackerStatus: (programId, status) => set(state => ({
      tracker: { ...state.tracker, [programId]: { status, updatedAt: new Date().toISOString() } }
    })),
    addToTracker: (programs) => set(state => {
      const next = { ...state.tracker }
      programs.forEach(p => {
        if (!next[p.id]) next[p.id] = { status: 'not_started', updatedAt: new Date().toISOString() }
      })
      return { tracker: next }
    }),
    clearTracker: () => set({ tracker: {} }),

    // Saved programs for tracker display
    savedPrograms: [],
    setSavedPrograms: (programs) => set({ savedPrograms: programs }),

    // User profile (persists across sessions)
    profile: {},
    setProfile: (profile) => set({ profile }),
    updateProfile: (updates) => set(state => ({ profile: { ...state.profile, ...updates } })),

    // Settings
    settings: {
      notifySMS:      false,
      notifyEmail:    true,
      phone:          '',
      email:          '',
      language:       'en',
      shareAnonymous: true,
      allowContact:   false,
    },
    setSettings: (settings) => set({ settings }),
    updateSettings: (updates) => set(state => ({ settings: { ...state.settings, ...updates } })),
  }),
  { name: 'compass-benefits-v2' }
))

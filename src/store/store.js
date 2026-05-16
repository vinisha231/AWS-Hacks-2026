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

    // Application tracker
    // tracker[id] = { status, updatedAt, history: [{status, timestamp, note}], snsReminderSet, snsReminderDate }
    tracker: {},
    setTrackerStatus: (programId, status, note = '') => set(state => {
      const existing = state.tracker[programId] || {}
      const history = existing.history || []
      return {
        tracker: {
          ...state.tracker,
          [programId]: {
            ...existing,
            status,
            updatedAt: new Date().toISOString(),
            history: [
              ...history,
              { status, timestamp: new Date().toISOString(), note },
            ],
          },
        },
      }
    }),
    setSnsReminder: (programId, reminderDate) => set(state => ({
      tracker: {
        ...state.tracker,
        [programId]: {
          ...state.tracker[programId],
          snsReminderSet: true,
          snsReminderDate: reminderDate,
        },
      },
    })),
    addToTracker: (programs) => set(state => {
      const next = { ...state.tracker }
      programs.forEach(p => {
        if (!next[p.id]) {
          const now = new Date().toISOString()
          next[p.id] = {
            status: 'not_started',
            updatedAt: now,
            history: [{ status: 'not_started', timestamp: now, note: 'Added from eligibility results' }],
            snsReminderSet: false,
            snsReminderDate: null,
          }
        }
      })
      return { tracker: next }
    }),
    clearTracker: () => set({ tracker: {} }),

    // Saved programs for tracker display
    savedPrograms: [],
    setSavedPrograms: (programs) => set({ savedPrograms: programs }),

    // User profile
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

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { upsertUser, getSparkProfile, getFlaggedTriggers } from '../lib/supabase'
import { useEmberStore } from '../store/emberStore'

export function useEmberAuth() {
  const { user, isAuthenticated } = useAuth()
  const { setUser, setSparkProfile, setFlaggedTriggers } = useEmberStore()

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) return
    async function syncUser() {
      try {
        const dbUser = await upsertUser(user.sub)
        setUser(dbUser)
        const [sparkProfile, flaggedTriggers] = await Promise.all([
          getSparkProfile(dbUser.id),
          getFlaggedTriggers(dbUser.id)
        ])
        setSparkProfile(sparkProfile)
        setFlaggedTriggers(flaggedTriggers)
      } catch (e) {
        console.warn('useEmberAuth sync error:', e.message)
      }
    }
    syncUser()
  }, [isAuthenticated, user?.sub])
}

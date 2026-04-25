import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { upsertUser, getSparkProfile, getFlaggedTriggers } from '../lib/supabase'
import { useEmberStore } from '../store/emberStore'

export function useEmberAuth() {
  const { user, isAuthenticated } = useAuth0()
  const { setUser, setSparkProfile, setFlaggedTriggers } = useEmberStore()

  useEffect(() => {
    if (!isAuthenticated || !user) return
    async function syncUser() {
      const dbUser = await upsertUser(user.sub)
      setUser(dbUser)
      const [sparkProfile, flaggedTriggers] = await Promise.all([
        getSparkProfile(dbUser.id),
        getFlaggedTriggers(dbUser.id)
      ])
      setSparkProfile(sparkProfile)
      setFlaggedTriggers(flaggedTriggers)
    }
    syncUser()
  }, [isAuthenticated, user])

  return { user, isAuthenticated }
}

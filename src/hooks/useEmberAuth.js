import { useEffect } from 'react'
import { onAuthChange, getUsername } from '../lib/auth'
import { upsertUser, getSparkProfile, getFlaggedTriggers } from '../lib/supabase'
import { useEmberStore } from '../store/emberStore'

export function useEmberAuth() {
  const { setUser, setSparkProfile, setFlaggedTriggers, setSession, setUsername } = useEmberStore()

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (session) => {
      setSession(session)
      if (!session) { setUser(null); setUsername(''); return }

      const uname = getUsername(session)
      setUsername(uname)

      try {
        const dbUser = await upsertUser(session.user.id)
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
    })

    return () => subscription.unsubscribe()
  }, [])
}

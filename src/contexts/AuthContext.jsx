import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSession, signIn, signUp, signOut, deleteAccount, refreshSession } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = refreshSession()
    setUser(session)
    setIsLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const session = await signIn(credentials)
    setUser(session)
    return session
  }, [])

  const register = useCallback(async (data) => {
    const result = await signUp(data)
    const session = await signIn({ email: data.email, password: data.password })
    setUser(session)
    return session
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
  }, [])

  const removeAccount = useCallback(async () => {
    if (!user) return
    await deleteAccount(user.email)
    setUser(null)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, removeAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }

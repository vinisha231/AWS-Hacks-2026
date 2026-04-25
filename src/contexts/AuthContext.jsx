import { createContext, useContext, useState, useEffect } from 'react'

const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { sub, username }
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ember_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setIsLoading(false)
  }, [])

  const signup = async (username, password) => {
    const res = await fetch(`${BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Signup failed')
    const u = { sub: data.sub, username: data.username }
    localStorage.setItem('ember_user', JSON.stringify(u))
    localStorage.setItem('ember_token', data.access_token)
    setUser(u)
    return u
  }

  const login = async (username, password) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    const u = { sub: data.sub, username: data.username }
    localStorage.setItem('ember_user', JSON.stringify(u))
    localStorage.setItem('ember_token', data.access_token)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('ember_user')
    localStorage.removeItem('ember_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

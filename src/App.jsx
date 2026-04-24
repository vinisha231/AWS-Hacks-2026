import { useAuth0 } from '@auth0/auth0-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Support from './pages/Support'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0()
  if (isLoading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <p className="text-amber-500 text-lg">Lighting your ember...</p>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/" />
}

export default function App() {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0()

  if (isLoading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <p className="text-amber-500">Loading...</p>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isAuthenticated
            ? <Navigate to="/home" />
            : (
              <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6">
                <div className="text-6xl">🔥</div>
                <h1 className="text-4xl font-bold text-white">Ember</h1>
                <p className="text-stone-400 text-center max-w-sm">
                  7 minutes is all it takes. We'll be there for every one of them.
                </p>
                <button
                  onClick={() => loginWithRedirect()}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-3 rounded-full transition-all"
                >
                  Begin Anonymously
                </button>
              </div>
            )
        } />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/support/:supportCode" element={<Support />} />
      </Routes>
    </BrowserRouter>
  )
}

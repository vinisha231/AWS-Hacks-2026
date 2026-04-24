import { useAuth0 } from '@auth0/auth0-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import Support from './pages/Support'
import SupportView from './pages/SupportView'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0()
  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl animate-pulse">🔥</span>
        <p className="text-amber-500 text-sm">Lighting your ember...</p>
      </div>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/" />
}

export default function App() {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0()

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <span className="text-4xl animate-pulse">🔥</span>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/home" /> : (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-8 p-6">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <span className="text-7xl">🔥</span>
                <h1 className="text-5xl font-black tracking-tight text-white">Ember</h1>
                <p className="text-stone-400 text-lg leading-relaxed">
                  A craving lasts 7 minutes.<br />
                  We'll be there for every second of it.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-sm w-full">
                {[
                  { emoji: '🧬', label: 'Hormone-matched sparks' },
                  { emoji: '🔒', label: 'Fully anonymous' },
                  { emoji: '⛓️', label: 'On-chain milestones' },
                ].map(({ emoji, label }) => (
                  <div key={label} className="bg-stone-900 border border-white/5 rounded-2xl p-4 text-center">
                    <span className="text-2xl">{emoji}</span>
                    <p className="text-stone-400 text-xs mt-2 leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => loginWithRedirect()}
                className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
              >
                Begin Anonymously
              </button>

              <p className="text-stone-700 text-xs">No name. No email required. Just you and the clock.</p>
            </div>
          )
        } />

        <Route path="/home"         element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/activity"     element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/onboarding"   element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/support-view" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/support/:supportCode" element={<SupportView />} />
      </Routes>
    </BrowserRouter>
  )
}

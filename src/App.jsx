import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing  from './pages/Landing'
import AuthPage from './pages/Auth'
import Intake   from './pages/Intake'
import Results  from './pages/Results'
import Apply    from './pages/Apply'
import Tracker  from './pages/Tracker'
import Profile  from './pages/Profile'
import Settings from './pages/Settings'

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
  if (!isAuthenticated) return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/"        element={<Landing />} />
      <Route path="/auth"    element={isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage />} />
      <Route path="/home"    element={isAuthenticated ? <Navigate to="/results" replace /> : <Navigate to="/" replace />} />
      <Route path="/intake"  element={<Intake />} />
      <Route path="/results" element={<Results />} />
      <Route path="/apply/:programId" element={<Apply />} />
      <Route path="/tracker" element={<Tracker />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Lazy-load all pages — each page becomes a separate chunk (low-bandwidth optimization)
const Landing  = lazy(() => import('./pages/Landing'))
const AuthPage = lazy(() => import('./pages/Auth'))
const Intake   = lazy(() => import('./pages/Intake'))
const Results  = lazy(() => import('./pages/Results'))
const Apply    = lazy(() => import('./pages/Apply'))
const Tracker  = lazy(() => import('./pages/Tracker'))
const Profile  = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))

function Spinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/auth"    element={isAuthenticated ? <Navigate to="/results" replace /> : <AuthPage />} />
        <Route path="/home"    element={isAuthenticated ? <Navigate to="/results" replace /> : <Navigate to="/" replace />} />
        <Route path="/intake"  element={<Intake />} />
        <Route path="/results" element={<Results />} />
        <Route path="/apply/:programId" element={<Apply />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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

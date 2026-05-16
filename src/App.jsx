import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TranslationProvider } from './contexts/TranslationContext'
import { useDynamicTranslations } from './contexts/TranslationContext'

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

function TranslatingBanner() {
  const { loading, lang } = useDynamicTranslations()
  if (!loading) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white text-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      Translating via Amazon Translate…
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
        <TranslationProvider>
          <TranslatingBanner />
          <AppRoutes />
        </TranslationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

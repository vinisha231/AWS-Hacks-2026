import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TranslationProvider } from './contexts/TranslationContext'
import { useDynamicTranslations } from './contexts/TranslationContext'
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports'; // if you use Amplify CLI
Amplify.configure(awsconfig);

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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-950 rounded-full animate-spin" />
    </div>
  )
}

function TranslatingBanner() {
  const { loading, noApi, lang } = useDynamicTranslations()
  if (loading) return (
    <div className="fixed bottom-4 right-4 z-50 bg-neutral-950 text-white text-sm px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Translating via Amazon Translate…
    </div>
  )
  if (noApi && lang !== 'en') return (
    <div className="fixed bottom-4 right-4 z-50 bg-neutral-800 text-neutral-200 text-xs px-4 py-2.5 rounded-md shadow-lg max-w-xs">
      Translation requires API connection. Set <code className="bg-neutral-700 px-1 rounded">VITE_API_ENDPOINT</code> in .env.local — showing English.
    </div>
  )
  return null
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
        <Route path="/intake"  element={<RequireAuth><Intake /></RequireAuth>} />
        <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
        <Route path="/apply/:programId" element={<RequireAuth><Apply /></RequireAuth>} />
        <Route path="/tracker" element={<RequireAuth><Tracker /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import PeerConnect from './pages/PeerConnect'
import Support from './pages/Support'
import SupportView from './pages/SupportView'
import { FlameIcon, BrainIcon, WaveformIcon, ChainIcon, ShieldIcon } from './components/Icons'
import FlareLogo from './components/FlareLogo'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <FlameIcon size={40} className="text-amber-500 animate-pulse" />
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/auth" />
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FlareLogo size={20} className="text-amber-500" />
          <span className="font-black text-lg tracking-tight">Flare</span>
        </div>
        <a href="/auth" className="text-sm text-stone-400 hover:text-white font-medium transition-colors">Sign in</a>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-8">
          <FlameIcon size={14} className="text-amber-400" />
          Recovery technology
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          A craving lasts<br /><span className="text-amber-400">7 minutes.</span>
        </h1>
        <p className="text-stone-400 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
          Flare intercepts the exact window a craving peaks — with a personalized activity,
          spoken in a voice you love, backed by an unbreakable commitment on-chain.
        </p>

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-6 py-4 mb-8 max-w-sm flex gap-3 text-left">
          <ShieldIcon size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300/80 text-sm leading-relaxed">
            <span className="font-semibold text-amber-300">No password recovery.</span>{' '}
            If you forget your credentials, you'll need a new account. Write them down before signing up.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <a href="/auth?mode=signup"
            className="bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-black font-bold text-base px-8 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20">
            Create account
          </a>
          <a href="/auth" className="text-stone-400 hover:text-white text-sm font-medium transition-colors px-4 py-4">
            Already have one? Sign in
          </a>
        </div>
        <p className="text-stone-600 text-xs mt-4">No email. No phone. 100% anonymous.</p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 w-full">
        <p className="text-stone-600 text-xs uppercase tracking-widest text-center mb-8">How it works</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Pillar Icon={BrainIcon} iconColor="text-violet-400" iconBg="bg-violet-500/10 border-violet-500/20"
            tag="Gemini AI" title="Reads what you're feeling"
            body="Speak into Flare when a craving hits. Gemini detects your emotional state and generates the exact 7-minute activity to intercept it." />
          <Pillar Icon={WaveformIcon} iconColor="text-pink-400" iconBg="bg-pink-500/10 border-pink-500/20"
            tag="ElevenLabs" title="Speaks in a voice you love"
            body="Clone your mom's voice. Your sponsor's. Whoever keeps you grounded. Flare speaks your spark activity in that voice — because it makes every difference." />
          <Pillar Icon={ChainIcon} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20"
            tag="Solana" title="Makes your promise unbreakable"
            body="Every craving survived is minted on-chain. Your streak is an immutable record on Solana devnet." />
          <Pillar Icon={ShieldIcon} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20"
            tag="Auth0" title="Zero identity required"
            body="No email. No phone number. Just a username and password — Auth0 authenticates you with zero personal data required." />
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-8 py-5 flex items-center justify-between text-stone-700 text-xs">
        <div className="flex items-center gap-1.5">
          <FlameIcon size={14} className="text-stone-700" />
          Flare · UW BHacks 2026
        </div>
        <span>Built in 48 hours</span>
      </footer>
    </div>
  )
}

function Pillar({ Icon, iconColor, iconBg, tag, title, body }) {
  return (
    <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        <span className={`text-xs font-semibold uppercase tracking-widest ${iconColor}`}>{tag}</span>
      </div>
      <div>
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-stone-400 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <FlameIcon size={40} className="text-amber-500 animate-pulse" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <LandingPage />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/home" /> : <Auth />} />
        <Route path="/home"         element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/activity"     element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/connect"      element={<ProtectedRoute><PeerConnect /></ProtectedRoute>} />
        <Route path="/onboarding"   element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/support-view" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/support/:supportCode" element={<SupportView />} />
      </Routes>
    </BrowserRouter>
  )
}

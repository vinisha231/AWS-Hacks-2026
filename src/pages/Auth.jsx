import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FlameIcon, ShieldIcon } from '../components/Icons'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) return setError('Fill in all fields.')
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim()))
      return setError('Username: 3–20 characters, letters/numbers/underscores only.')
    if (mode === 'signup') {
      if (password !== confirm) return setError('Passwords do not match.')
      if (password.length < 8) return setError('Password must be at least 8 characters.')
    }

    setLoading(true)
    try {
      if (mode === 'signup') await signup(username.trim(), password)
      else await login(username.trim(), password)
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FlameIcon size={20} className="text-amber-500" />
          <span className="font-black text-lg tracking-tight">Ember</span>
        </div>
        <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
          className="text-sm text-stone-400 hover:text-white transition-colors">
          {mode === 'login' ? 'Create account' : 'Sign in instead'}
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
              <FlameIcon size={32} className="text-amber-400" />
            </div>
            <h1 className="text-3xl font-black mb-1">
              {mode === 'login' ? 'Welcome back.' : 'Begin anonymously.'}
            </h1>
            <p className="text-stone-500 text-sm">
              {mode === 'login' ? 'Sign in to continue your streak.' : 'No email. No phone. Just a username.'}
            </p>
          </div>

          {mode === 'signup' && (
            <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 flex gap-3">
              <ShieldIcon size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300/80 text-xs leading-relaxed">
                <span className="font-semibold text-amber-300">No password recovery.</span>{' '}
                If you forget your username or password, you'll need a new account. Write them down somewhere safe.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-widest font-medium block mb-1.5">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="your_handle" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                className="w-full bg-stone-900 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm" />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-widest font-medium block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-900 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm" />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="text-stone-400 text-xs uppercase tracking-widest font-medium block mb-1.5">Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-900 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm" />
              </div>
            )}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-bold py-4 rounded-xl transition-all mt-1 disabled:opacity-50">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-stone-600 hover:text-stone-400 text-sm transition-colors text-center">
            {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

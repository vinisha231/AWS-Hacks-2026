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
    <div className="min-h-screen flex flex-col" style={{ background: '#e8f4e8' }}>
      <nav className="flex items-center justify-between px-8 py-5 border-b border-green-200">
        <div className="flex items-center gap-2">
          <FlameIcon size={20} className="text-green-600" />
          <span className="font-black text-lg tracking-tight text-stone-900">Flare</span>
        </div>
        <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
          {mode === 'login' ? 'Create account' : 'Sign in instead'}
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 border border-green-200 flex items-center justify-center mx-auto mb-5">
              <FlameIcon size={32} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-black mb-1 text-stone-900">
              {mode === 'login' ? 'Welcome back.' : 'Begin anonymously.'}
            </h1>
            <p className="text-stone-500 text-sm">
              {mode === 'login' ? 'Sign in to continue your streak.' : 'No email. No phone. Just a username.'}
            </p>
          </div>

          {mode === 'signup' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <ShieldIcon size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs leading-relaxed">
                <span className="font-semibold">No password recovery.</span>{' '}
                If you forget your username or password, you'll need a new account. Write them down somewhere safe.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-stone-500 text-xs uppercase tracking-widest font-medium block mb-1.5">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="your_handle" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-green-500 text-sm" />
            </div>
            <div>
              <label className="text-stone-500 text-xs uppercase tracking-widest font-medium block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-green-500 text-sm" />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="text-stone-500 text-xs uppercase tracking-widest font-medium block mb-1.5">Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-green-500 text-sm" />
              </div>
            )}
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all mt-1 disabled:opacity-50">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-stone-500 hover:text-stone-800 text-sm transition-colors text-center">
            {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

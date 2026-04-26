import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FlareLogo from '../components/FlareLogo'

const BG   = '#FAF3E0'
const RUST = '#C94B2C'

export default function Auth() {
  const [mode, setMode]       = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
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
      if (password.length < 8)  return setError('Password must be at least 8 characters.')
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

  const toggle = () => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
        <FlareLogo size={80} />
        <h1 className="serif" style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '0.3em', color: '#2C2416', marginTop: '0.5rem' }}>FLARE</h1>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: '#8C7A5A', marginTop: '0.4rem', textTransform: 'uppercase' }}>
          The Right Help at the Right Time
        </p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <h2 className="serif" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2C2416' }}>
          {mode === 'signup' ? 'Begin anonymously.' : 'Welcome back.'}
        </h2>
        <p style={{ color: '#8C7A5A', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
          {mode === 'signup' ? 'No email. No phone. Just a username.' : 'Sign in to continue your streak.'}
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Enter your user name"
            autoCapitalize="none" autoCorrect="off"
            style={inputStyle}
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={inputStyle}
          />
          {mode === 'signup' && (
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Enter your password again for confirmation"
              style={inputStyle}
            />
          )}

          {error && (
            <p style={{ color: RUST, fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: '0.5rem',
            background: RUST,
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '1rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            letterSpacing: '0.05em',
          }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button onClick={toggle} style={{ background: 'none', border: 'none', color: '#8C7A5A', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.25rem' }}>
          {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.7)',
  border: 'none',
  borderRadius: '50px',
  padding: '0.9rem 1.5rem',
  fontSize: '0.95rem',
  color: '#2C2416',
  outline: 'none',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

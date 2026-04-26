import { useState, useEffect } from 'react'
import { useEmberStore } from '../store/emberStore'
import { useEmberAuth } from '../hooks/useEmberAuth'
import Layout from '../components/Layout'
import CravingInterceptor from '../components/CravingInterceptor'
import VoiceCheckin from '../components/VoiceCheckin'
import DailyCheckin from '../components/DailyCheckin'
import ProfileSetupModal from '../components/ProfileSetupModal'
import RelapseModal from '../components/RelapseModal'
import CalmPage from './CalmPage'

const RUST  = '#C94B2C'
const AMBER = '#C9953A'
const BLUE  = '#C8D8E8'
const LAVEN = '#D4C8E8'
const CREAM = '#FAF3E0'
const DARK  = '#2C2416'
const MID   = '#8C7A5A'

export default function Home() {
  const [phase, setPhase] = useState('idle')
  const [showRelapse, setShowRelapse] = useState(false)
  const { dayCount, activateCraving, setLastMoodAnalysis,
    profileSetupDone, recordLogin, goals, sessionsCompleted } = useEmberStore()
  useEmberAuth()
  useEffect(() => { recordLogin() }, [])

  const handleCravingButton = () => { activateCraving(); setPhase('calm') }
  const handleCalmContinue  = () => setPhase('voice')
  const handleVoiceComplete = (m) => { setLastMoodAnalysis(m); setPhase('craving') }
  const handleVoiceSkip     = () => setPhase('craving')
  const handleClose         = () => setPhase('idle')

  const activeGoals = (goals || []).filter(g => !g.done).slice(0, 2)
  const total       = sessionsCompleted || 0
  const winPct      = total > 0 ? Math.min(99, Math.round((total / (total + 1)) * 100)) : 77

  return (
    <>
      {!profileSetupDone && <ProfileSetupModal />}

      <Layout>
        {/* Full-viewport two-column hero */}
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          background: CREAM,
        }}>

          {/* ── LEFT PANEL ── */}
          <div style={{
            flex: '0 0 45%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '2.5rem',
            padding: '3rem 2.5rem 3rem 3rem',
            borderRight: `1px solid rgba(44,36,22,0.08)`,
          }}>
            {/* Streak */}
            <div>
              <p className="serif" style={{
                fontSize: 'clamp(5rem, 10vw, 8rem)',
                fontWeight: 700,
                fontStyle: 'italic',
                color: DARK,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}>
                {dayCount}
              </p>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: MID, textTransform: 'uppercase', marginTop: '0.25rem' }}>
                Streak
              </p>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              <button onClick={handleCravingButton} style={{
                background: RUST,
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '1.1rem 2.2rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(201,75,44,0.28)',
                whiteSpace: 'nowrap',
              }}>
                I'm Craving
              </button>
              <p style={{ fontSize: '11px', color: MID, marginLeft: '2px', letterSpacing: '0.02em' }}>
                Press this the moment you're craving
              </p>

              <button onClick={() => setShowRelapse(true)} style={{
                background: 'rgba(201,75,44,0.12)',
                color: RUST,
                border: 'none',
                borderRadius: '50px',
                padding: '0.45rem 1.1rem',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginTop: '0.25rem',
              }}>
                I Relapsed
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL: 2×2 cards ── */}
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '0',
            padding: '2rem',
            alignContent: 'center',
          }}>

            {/* Goals card — amber */}
            <Card bg={AMBER} padded>
              <PlusBtn />
              {activeGoals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeGoals.map(g => (
                    <p key={g.id} className="serif" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                      {g.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="serif" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                  A sticky note that shows the goal that they set
                </p>
              )}
            </Card>

            {/* Voice card — rust */}
            <Card bg={RUST} padded>
              <PlusBtn light />
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <span style={{ color: '#fff', fontSize: '20px', marginLeft: '4px' }}>▶</span>
              </div>
              <p className="serif" style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                audio that plays in the voice of their loved one.
              </p>
            </Card>

            {/* Milestones card — blue */}
            <Card bg={BLUE} padded>
              <PlusBtn dark />
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚩</div>
              <p className="serif" style={{ fontSize: '1.4rem', fontWeight: 600, color: DARK }}>Milestones</p>
            </Card>

            {/* Streak % card — lavender */}
            <Card bg={LAVEN} padded>
              <PlusBtn dark />
              {/* Arc gauge */}
              <svg viewBox="0 0 100 60" style={{ width: '90px', marginBottom: '0.5rem' }}>
                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="rgba(90,70,110,0.2)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#7A5A9A" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(winPct / 100) * 125} 125`} />
                <text x="50" y="52" textAnchor="middle" style={{ fontSize: '18px', fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fill: DARK }}>
                  {winPct}%
                </text>
              </svg>
              <p className="serif" style={{ fontSize: '1.1rem', fontWeight: 600, color: DARK }}>Check out your streak</p>
            </Card>
          </div>
        </div>

        {/* Daily check-in */}
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>
          <DailyCheckin />
        </div>
      </Layout>

      {phase === 'calm'    && <CalmPage onContinue={handleCalmContinue} />}
      {phase === 'voice'   && <VoiceCheckin onComplete={handleVoiceComplete} onSkip={handleVoiceSkip} />}
      {phase === 'craving' && <CravingInterceptor onClose={handleClose} />}
      {showRelapse         && <RelapseModal onClose={() => setShowRelapse(false)} />}
    </>
  )
}

function Card({ bg, children, padded }) {
  return (
    <div style={{
      background: bg,
      borderRadius: '20px',
      padding: padded ? '1.6rem' : '1rem',
      position: 'relative',
      margin: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      minHeight: '200px',
    }}>
      {children}
    </div>
  )
}

function PlusBtn({ light, dark }) {
  const color = light ? 'rgba(255,255,255,0.6)' : dark ? 'rgba(44,36,22,0.35)' : 'rgba(255,255,255,0.6)'
  return (
    <div style={{
      position: 'absolute', top: '1rem', right: '1rem',
      width: '28px', height: '28px', borderRadius: '50%',
      border: `1.5px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color,
      fontSize: '18px',
      lineHeight: 1,
      fontWeight: 300,
      cursor: 'pointer',
    }}>+</div>
  )
}

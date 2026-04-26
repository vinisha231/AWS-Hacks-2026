import { useState, useEffect } from 'react'
import { useEmberStore } from '../store/emberStore'
import { useEmberAuth } from '../hooks/useEmberAuth'
import Layout from '../components/Layout'
import CravingInterceptor from '../components/CravingInterceptor'
import VoiceCheckin from '../components/VoiceCheckin'
import StreakCalendar from '../components/StreakCalendar'
import MilestoneBadges from '../components/MilestoneBadges'
import DailyAffirmation from '../components/DailyAffirmation'
import RecentActivity from '../components/RecentActivity'
import DailyCheckin from '../components/DailyCheckin'
import ProfileSetupModal from '../components/ProfileSetupModal'
import RelapseModal from '../components/RelapseModal'
import CalmPage from './CalmPage'
import GoalsPanel from '../components/GoalsPanel'

const RUST   = '#C94B2C'
const AMBER  = '#C9953A'
const BLUE   = '#C8D8E8'
const LAVEN  = '#D4C8E8'
const CREAM  = '#FAF3E0'
const DARK   = '#2C2416'

function HomeCard({ bg, children, style = {} }) {
  return (
    <div style={{
      background: bg,
      borderRadius: '20px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function Home() {
  const [phase, setPhase] = useState('idle')
  const [showRelapse, setShowRelapse] = useState(false)
  const { dayCount, activateCraving, setLastMoodAnalysis,
    profileSetupDone, recordLogin, goals } = useEmberStore()
  useEmberAuth()

  useEffect(() => { recordLogin() }, [])

  const handleCravingButton = () => { activateCraving(); setPhase('calm') }
  const handleCalmContinue  = () => setPhase('voice')
  const handleVoiceComplete = (m) => { setLastMoodAnalysis(m); setPhase('craving') }
  const handleVoiceSkip     = () => setPhase('craving')
  const handleClose         = () => setPhase('idle')

  const activeGoals = (goals || []).filter(g => !g.done).slice(0, 2)

  return (
    <>
      {!profileSetupDone && <ProfileSetupModal />}

      <Layout rightPanel={<GoalsPanel />}>
        <div style={{ minHeight: '100vh', background: CREAM, padding: '0' }}>

          {/* ── Hero section ── */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '3rem 3rem 2rem' }}>

            {/* Streak */}
            <p style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8C7A5A', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Current streak
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
              <span className="serif" style={{ fontSize: 'clamp(5rem,16vw,9rem)', fontWeight: 700, color: DARK, lineHeight: 1 }}>
                {dayCount}
              </span>
              <span style={{ fontSize: '1.5rem', color: '#8C7A5A', marginBottom: '0.8rem', fontWeight: 300 }}>
                {dayCount === 1 ? 'day' : 'days'}
              </span>
            </div>

            <p style={{ color: '#8C7A5A', fontSize: '1rem', maxWidth: '320px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              {dayCount === 0 && "Every journey starts with a single day. You've got this."}
              {dayCount >= 1 && dayCount < 7 && `${7 - dayCount} more days to your first week. Keep going.`}
              {dayCount >= 7 && dayCount < 30 && `${30 - dayCount} days to one month. The hardest part is behind you.`}
              {dayCount >= 30 && `Day ${dayCount}. You're in territory most people never reach.`}
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              <button onClick={handleCravingButton} style={{
                background: RUST,
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                padding: '1.1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(201,75,44,0.3)',
                textTransform: 'uppercase',
              }}>
                I'm Craving
              </button>
              <p style={{ fontSize: '12px', color: '#8C7A5A', marginLeft: '4px' }}>
                Press this the moment you're craving
              </p>
              <button onClick={() => setShowRelapse(true)} style={{
                background: 'rgba(201,75,44,0.12)',
                color: RUST,
                border: 'none',
                borderRadius: '50px',
                padding: '0.5rem 1.2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}>
                I Relapsed
              </button>
            </div>

            {/* ── Feature cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '3rem', maxWidth: '480px' }}>

              {/* Goals card */}
              <HomeCard bg={AMBER}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Goals</p>
                {activeGoals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activeGoals.map(g => (
                      <p key={g.id} className="serif" style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                        {g.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="serif" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                    A sticky note that shows the goal that they set
                  </p>
                )}
              </HomeCard>

              {/* Voice card */}
              <HomeCard bg={RUST}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#fff', fontSize: '20px', marginLeft: '3px' }}>▶</span>
                </div>
                <p className="serif" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                  audio that plays in the voice of their loved one.
                </p>
              </HomeCard>

              {/* Milestones card */}
              <HomeCard bg={BLUE}>
                <p style={{ fontSize: '10px', color: 'rgba(44,36,22,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Progress</p>
                <p style={{ fontSize: '2.5rem' }}>🚩</p>
                <p className="serif" style={{ fontSize: '1.1rem', fontWeight: 600, color: DARK, marginTop: '0.5rem' }}>Milestones</p>
              </HomeCard>

              {/* Streak card */}
              <HomeCard bg={LAVEN}>
                <p style={{ fontSize: '10px', color: 'rgba(44,36,22,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Streak</p>
                <p className="serif" style={{ fontSize: '2.5rem', fontWeight: 700, color: DARK, lineHeight: 1 }}>{dayCount}</p>
                <p className="serif" style={{ fontSize: '1rem', color: '#5A4A6A', marginTop: '0.25rem' }}>Check out your streak</p>
              </HomeCard>
            </div>
          </div>

          {/* ── Scrollable content below ── */}
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 3rem 5rem' }}>
            <div style={{ borderTop: '1px solid rgba(44,36,22,0.1)', paddingTop: '2rem', paddingBottom: '2rem' }}>
              <DailyAffirmation />
            </div>
            <div style={{ borderTop: '1px solid rgba(44,36,22,0.1)', paddingTop: '2rem', paddingBottom: '2rem' }}>
              <DailyCheckin />
            </div>
            <div style={{ borderTop: '1px solid rgba(44,36,22,0.1)', paddingTop: '2rem', paddingBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <StreakCalendar />
              <MilestoneBadges />
            </div>
            <div style={{ borderTop: '1px solid rgba(44,36,22,0.1)', paddingTop: '2rem', paddingBottom: '2rem' }}>
              <RecentActivity />
            </div>
          </div>
        </div>
      </Layout>

      {phase === 'calm'    && <CalmPage onContinue={handleCalmContinue} />}
      {phase === 'voice'   && <VoiceCheckin onComplete={handleVoiceComplete} onSkip={handleVoiceSkip} />}
      {phase === 'craving' && <CravingInterceptor onClose={handleClose} />}
      {showRelapse         && <RelapseModal onClose={() => setShowRelapse(false)} />}
    </>
  )
}

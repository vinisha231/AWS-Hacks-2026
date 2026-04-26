import { useState, useEffect, useRef } from 'react'
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

const MILESTONES = [
  { days: 1,   label: 'First Spark',  color: '#4CAF50' },
  { days: 3,   label: '3-Day Flame',  color: '#FF9800' },
  { days: 7,   label: 'One Week',     color: '#FFC107' },
  { days: 14,  label: 'Two Weeks',    color: '#2196F3' },
  { days: 30,  label: 'One Month',    color: '#00BCD4' },
  { days: 100, label: '100 Days',     color: '#9C27B0' },
]

const AFFIRMATIONS = [
  "I'm so proud of you for being here. Every single moment you choose to show up takes real courage.",
  "I can see how strong you are. What you're doing isn't easy, and you're doing it anyway.",
  "You've come further than you think. I believe in you — keep going.",
  "You are not alone in this. I'm right here with you, and I'm proud of every step you take.",
]

export default function Home() {
  const [phase, setPhase] = useState('idle')
  const [showRelapse, setShowRelapse] = useState(false)
  const { dayCount, activateCraving, setLastMoodAnalysis,
    profileSetupDone, recordLogin, goals, sessionsCompleted,
    quitGoals, mainGoalId, primaryVoiceId } = useEmberStore()
  useEmberAuth()
  useEffect(() => { recordLogin() }, [])

  const handleCravingButton = () => { activateCraving(); setPhase('calm') }
  const handleCalmContinue  = () => setPhase('voice')
  const handleVoiceComplete = (m) => { setLastMoodAnalysis(m); setPhase('craving') }
  const handleVoiceSkip     = () => setPhase('craving')
  const handleClose         = () => setPhase('idle')

  const mainGoal = quitGoals.find(g => g.id === mainGoalId)

  return (
    <>
      {!profileSetupDone && <ProfileSetupModal />}

      <Layout>
        <div style={{ display: 'flex', minHeight: '100vh', background: CREAM }}>

          {/* ── LEFT PANEL ── */}
          <div style={{
            flex: '0 0 42%',
            display: 'flex',
            flexDirection: 'column',
            padding: '3rem 2.5rem 3rem 3rem',
            gap: '2rem',
          }}>
            {/* I'm Craving button */}
            <div>
              <button onClick={handleCravingButton} style={{
                background: RUST, color: '#fff', border: 'none',
                borderRadius: '14px', padding: '1.1rem 2.2rem',
                fontSize: '1.05rem', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: '0 8px 32px rgba(201,75,44,0.28)',
                whiteSpace: 'nowrap',
              }}>
                I'm Craving
              </button>
              <p style={{ fontSize: '11px', color: MID, marginTop: '6px', marginLeft: '2px', letterSpacing: '0.02em' }}>
                Press this the moment you're craving
              </p>
            </div>

            {/* I Relapsed button */}
            <button onClick={() => setShowRelapse(true)} style={{
              background: 'rgba(201,75,44,0.12)', color: RUST, border: 'none',
              borderRadius: '50px', padding: '0.45rem 1.1rem',
              fontSize: '0.7rem', fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', alignSelf: 'flex-start',
            }}>
              I Relapsed
            </button>

            {/* Streak */}
            <div>
              <p className="serif" style={{
                fontSize: 'clamp(4.5rem, 9vw, 7.5rem)', fontWeight: 700,
                fontStyle: 'italic', color: DARK, lineHeight: 1, letterSpacing: '-0.02em',
              }}>
                {dayCount}
              </p>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: MID, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                Streak
              </p>
            </div>

            {/* Daily check-in */}
            <div style={{ flex: 1 }}>
              <DailyCheckin />
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
            <GoalsCard mainGoal={mainGoal} quitGoals={quitGoals} />
            <AudioCard voiceId={primaryVoiceId} voiceLabel={useEmberStore.getState().activeVoice?.label} />
            <MilestonesCard dayCount={dayCount} />
            <StreakCalCard dayCount={dayCount} />
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

/* ── Goals card ── */
function GoalsCard({ mainGoal, quitGoals }) {
  const [open, setOpen] = useState(false)
  const { deleteQuitGoal, setMainGoal } = useEmberStore()

  return (
    <Card bg={AMBER} padded>
      <PlusBtn onClick={() => setOpen(true)} />
      {/* Label pinned top-left */}
      <p style={{
        position: 'absolute', top: '1.4rem', left: '1.4rem',
        fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.65)',
      }}>
        Main Goal
      </p>
      {/* Goal fills the card */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2.5rem 1.6rem',
      }}>
        {mainGoal ? (
          <p className="serif" style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', fontWeight: 700,
            color: '#fff', lineHeight: 1.25, textAlign: 'center',
          }}>
            {mainGoal.text}
          </p>
        ) : (
          <p className="serif" style={{
            fontSize: '1.2rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, textAlign: 'center',
          }}>
            Add your goal in Profile
          </p>
        )}
      </div>

      {open && (
        <Overlay onClose={() => setOpen(false)} title="Your Goals">
          {quitGoals.length === 0 ? (
            <p style={{ color: MID, fontSize: '14px', textAlign: 'center', padding: '2rem 0' }}>
              No goals yet — add them in Profile.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quitGoals.map(g => (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '12px',
                  background: g.id === useEmberStore.getState().mainGoalId ? 'rgba(201,149,58,0.12)' : 'rgba(44,36,22,0.04)',
                  border: g.id === useEmberStore.getState().mainGoalId ? '1.5px solid rgba(201,149,58,0.5)' : '1px solid rgba(44,36,22,0.1)',
                }}>
                  <button onClick={() => setMainGoal(g.id)} title="Set as main" style={{
                    width: '20px', height: '20px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: g.id === useEmberStore.getState().mainGoalId ? AMBER : 'rgba(44,36,22,0.1)',
                    flexShrink: 0,
                  }} />
                  <p style={{ flex: 1, fontSize: '14px', color: DARK, fontWeight: g.id === useEmberStore.getState().mainGoalId ? 600 : 400 }}>
                    {g.text}
                  </p>
                  <button onClick={() => deleteQuitGoal(g.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: MID, fontSize: '18px', lineHeight: 1, padding: '0 2px',
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </Overlay>
      )}
    </Card>
  )
}

/* ── Audio card ── */
function AudioCard({ voiceId, voiceLabel }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)
  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
  const { activeVoice } = useEmberStore()
  const label = voiceLabel || activeVoice?.label || 'your companion'

  const play = async () => {
    if (playing) return
    setPlaying(true)
    const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
    try {
      const res = await fetch(`${SERVER}/api/elevenlabs/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url) }
      audio.play()
    } catch {
      setPlaying(false)
    }
  }

  return (
    <Card bg={RUST} padded>
      {/* Label top-left */}
      <p style={{
        position: 'absolute', top: '1.4rem', left: '1.4rem',
        fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.65)',
      }}>
        Voice recording of
      </p>

      {/* Content centered */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
      }}>
        <button onClick={play} style={{
          width: '64px', height: '64px', borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.55)',
          background: 'none', cursor: playing ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {playing ? (
            <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1].map(i => (
                <span key={i} style={{
                  width: '3px', height: '16px', background: '#fff', borderRadius: '2px',
                  opacity: 0.9, animation: `bounce 0.7s ease-in-out ${i * 0.2}s infinite alternate`,
                }} />
              ))}
            </span>
          ) : (
            <span style={{ color: '#fff', fontSize: '22px', marginLeft: '5px' }}>▶</span>
          )}
        </button>
        <p className="serif" style={{
          fontSize: '1.3rem', fontWeight: 600, color: '#fff',
          textAlign: 'center', lineHeight: 1.2,
        }}>
          {label}
        </p>
      </div>
    </Card>
  )
}

/* ── Milestones card ── */
function MilestonesCard({ dayCount }) {
  const [open, setOpen] = useState(false)
  const earned = MILESTONES.filter(m => dayCount >= m.days)
  const next = MILESTONES.find(m => dayCount < m.days)

  return (
    <Card bg={BLUE} padded>
      <PlusBtn dark onClick={() => setOpen(true)} />

      {/* Label top-left */}
      <p style={{
        position: 'absolute', top: '1.4rem', left: '1.4rem',
        fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: MID,
      }}>
        Milestones
      </p>

      {/* Content fills card */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '1.4rem',
        gap: '10px',
      }}>
        {MILESTONES.slice(0, 4).map(m => {
          const done = dayCount >= m.days
          const isNext = m === next
          return (
            <div key={m.days} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              opacity: done ? 1 : isNext ? 0.7 : 0.3,
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: done ? m.color : isNext ? MID : 'rgba(44,36,22,0.2)',
              }} />
              <p style={{
                fontSize: '13px', fontWeight: done ? 600 : 400,
                color: done ? m.color : DARK, flex: 1,
              }}>
                {m.label}
              </p>
              <p style={{ fontSize: '11px', color: MID }}>Day {m.days}</p>
            </div>
          )
        })}

        {next && (
          <div style={{ marginTop: '6px' }}>
            <div style={{ height: '3px', background: 'rgba(44,36,22,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: RUST, borderRadius: '4px',
                width: `${Math.min((dayCount / next.days) * 100, 100)}%`,
                transition: 'width 0.6s',
              }} />
            </div>
            <p style={{ fontSize: '10px', color: MID, marginTop: '4px' }}>
              {next.days - dayCount} days to {next.label}
            </p>
          </div>
        )}
      </div>

      {open && (
        <Overlay onClose={() => setOpen(false)} title="Milestones">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {MILESTONES.map(m => {
              const done = dayCount >= m.days
              return (
                <div key={m.days} style={{
                  padding: '12px', borderRadius: '12px', textAlign: 'center',
                  background: done ? `${m.color}18` : 'rgba(44,36,22,0.04)',
                  border: `1px solid ${done ? m.color + '44' : 'rgba(44,36,22,0.1)'}`,
                  opacity: done ? 1 : 0.4,
                }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: done ? m.color : MID }}>{m.label}</p>
                  <p style={{ fontSize: '11px', color: MID, marginTop: '2px' }}>Day {m.days}</p>
                  {done && <p style={{ fontSize: '10px', color: m.color, marginTop: '4px', fontWeight: 700 }}>EARNED</p>}
                </div>
              )
            })}
          </div>
        </Overlay>
      )}
    </Card>
  )
}

/* ── Streak / Calendar card ── */
function StreakCalCard({ dayCount }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayStr = today.toISOString().split('T')[0]

  const { loginDays } = useEmberStore()
  const [simDays, setSimDays] = useState(() => new Set(loginDays))
  const [simStreak, setSimStreak] = useState(dayCount)
  const [modified, setModified] = useState(false)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const monthName = today.toLocaleString('default', { month: 'short' }).toUpperCase()

  const calcStreak = (days) => {
    let streak = 0
    const d = new Date()
    while (true) {
      const s = d.toISOString().split('T')[0]
      if (!days.has(s)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const toggleDay = (dateStr) => {
    if (dateStr > todayStr) return
    const next = new Set(simDays)
    if (next.has(dateStr)) next.delete(dateStr)
    else next.add(dateStr)
    setSimDays(next)
    setSimStreak(calcStreak(next))
    setModified(true)
  }

  const reset = () => {
    setSimDays(new Set(loginDays))
    setSimStreak(dayCount)
    setModified(false)
  }

  const days = []
  for (let i = 0; i < firstDow; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ d, s, logged: simDays.has(s), future: s > todayStr })
  }

  return (
    <Card bg={LAVEN} padded>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(90,70,110,0.7)', marginBottom: '2px' }}>
            Streak
          </p>
          <p className="serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: DARK, lineHeight: 1 }}>
            {simStreak}
            {modified && <span style={{ fontSize: '11px', color: MID, fontFamily: 'Inter, sans-serif', fontWeight: 400, marginLeft: '6px' }}>sim</span>}
          </p>
        </div>
        {modified && (
          <button onClick={reset} style={{
            background: 'rgba(90,70,110,0.12)', border: 'none', borderRadius: '8px',
            padding: '4px 10px', fontSize: '11px', color: '#5A4670', cursor: 'pointer', fontWeight: 600,
          }}>Reset</button>
        )}
      </div>

      {/* Mini calendar */}
      <div style={{ marginTop: '10px' }}>
        <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: MID, marginBottom: '6px' }}>{monthName} {year}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '7px', color: MID, fontWeight: 600, paddingBottom: '2px' }}>{d}</div>
          ))}
          {days.map((cell, i) => (
            <button key={i} onClick={() => cell && !cell.future && toggleDay(cell.s)}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: '50%', border: 'none',
                background: !cell || cell.future ? 'transparent'
                  : cell.logged ? (cell.s === todayStr ? RUST : '#7A5A9A')
                  : 'rgba(44,36,22,0.07)',
                color: !cell ? 'transparent'
                  : cell.future ? 'rgba(44,36,22,0.2)'
                  : cell.logged ? '#fff' : MID,
                fontSize: '8px', fontWeight: 500,
                cursor: cell && !cell.future ? 'pointer' : 'default',
              }}>
              {cell ? cell.d : ''}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

/* ── Shared primitives ── */
function Card({ bg, children, padded }) {
  return (
    <div style={{
      background: bg, borderRadius: '20px',
      padding: padded ? '1.4rem' : '1rem',
      position: 'relative', margin: '0.5rem',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', minHeight: '190px',
    }}>
      {children}
    </div>
  )
}

function PlusBtn({ light, dark, onClick }) {
  const color = dark ? 'rgba(44,36,22,0.35)' : 'rgba(255,255,255,0.6)'
  return (
    <button onClick={onClick} style={{
      position: 'absolute', top: '1rem', right: '1rem',
      width: '28px', height: '28px', borderRadius: '50%',
      border: `1.5px solid ${color}`,
      background: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, fontSize: '18px', lineHeight: 1, fontWeight: 300,
    }}>+</button>
  )
}

function Overlay({ onClose, title, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(44,36,22,0.35)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: CREAM, borderRadius: '20px',
        padding: '1.75rem', width: '340px', maxWidth: '90vw',
        boxShadow: '0 24px 64px rgba(44,36,22,0.18)',
        maxHeight: '80vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 className="serif" style={{ fontSize: '1.3rem', fontWeight: 600, color: DARK }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '22px', color: MID, lineHeight: 1,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

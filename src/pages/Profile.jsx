import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useEmberStore } from '../store/emberStore'
import Layout from '../components/Layout'
import VoicePicker from '../components/VoicePicker'
import RecoveryStake from '../components/RecoveryStake'

const ADDICTION_OPTIONS = [
  'Nicotine', 'Alcohol', 'Cannabis', 'Gambling', 'Social media',
  'Gaming', 'Opioids', 'Food', 'Shopping', 'Other',
]

const SPARK_INTERESTS = [
  'Drawing', 'Poetry', 'Origami', 'Coding', 'Languages', 'Magic tricks',
  'Photography', 'Music', 'Astronomy', 'History', 'Philosophy', 'Puzzles',
  'Cooking new things', 'Gardening', 'Writing', 'Chess',
]

export default function Profile() {
  const { user: authUser, logout } = useAuth()
  const {
    user, setUser, setFlaggedTriggers, setJourneyProfile, setUserInterests,
    journeyStage: savedStage, pastBlockers: savedBlockers, userInterests: savedInterests,
    quitGoals, mainGoalId, addQuitGoal, deleteQuitGoal, setMainGoal,
  } = useEmberStore()

  const [addictions, setAddictions] = useState([])
  const [wantToTry, setWantToTry] = useState(savedInterests || [])
  const [customTry, setCustomTry] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [heavyTopics, setHeavyTopics] = useState('')
  const [journeyStage, setJourneyStage] = useState(savedStage || null)
  const [blockers, setBlockers] = useState(savedBlockers || [])
  const [customBlocker, setCustomBlocker] = useState('')
  const [quitInput, setQuitInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setAddictions(user.addiction_type ? user.addiction_type.split(',').map(s => s.trim()).filter(Boolean) : [])
  }, [user])

  const toggle = (list, setList, val) =>
    setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const addCustom = () => {
    const t = customTry.trim()
    if (t && !wantToTry.includes(t)) { setWantToTry(p => [...p, t]); setCustomTry('') }
  }

  const handleSave = async () => {
    if (!authUser?.sub) return
    setSaving(true)
    const heavyArr = heavyTopics.split(',').map(s => s.trim()).filter(Boolean)

    const { data } = await supabase.from('users')
      .update({ addiction_type: addictions.join(', ') })
      .eq('auth0_id', authUser.sub).select().single()
    if (data) setUser(data)

    if (heavyArr.length && user?.id) {
      await supabase.from('flagged_triggers')
        .upsert(heavyArr.map(topic => ({ user_id: user.id, topic, reason: 'user_set' })), { onConflict: 'user_id,topic' })
      setFlaggedTriggers(heavyArr)
    }
    setJourneyProfile(journeyStage, blockers)
    setUserInterests(wantToTry)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const copySupport = () => {
    if (user?.support_code)
      navigator.clipboard.writeText(`${window.location.origin}/support/${user.support_code}`)
  }

  return (
    <Layout>
      <div className="px-6 md:px-12 py-10 max-w-2xl mx-auto w-full flex flex-col gap-10">
        <div>
          <h1 className="text-4xl font-black text-stone-900 mb-1">Profile</h1>
          <p className="text-stone-400">Everything stays private. We use this to personalise your sparks.</p>
          {authUser?.username && (
            <p className="text-stone-500 text-sm mt-1">Signed in as <span className="text-stone-700 font-medium">{authUser.username}</span></p>
          )}
        </div>

        <Section title="What are your goals to quit?" sub={`Add up to 5. Tap to set your main goal. (${quitGoals.length}/5)`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {quitGoals.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '12px',
                background: g.id === mainGoalId ? 'rgba(201,149,58,0.1)' : 'rgba(44,36,22,0.03)',
                border: `1.5px solid ${g.id === mainGoalId ? 'rgba(201,149,58,0.5)' : 'rgba(44,36,22,0.1)'}`,
              }}>
                <button
                  onClick={() => setMainGoal(g.id)}
                  title="Set as main goal"
                  style={{
                    width: '18px', height: '18px', borderRadius: '50%', border: 'none', flexShrink: 0,
                    background: g.id === mainGoalId ? '#C9953A' : 'rgba(44,36,22,0.15)',
                    cursor: 'pointer',
                  }}
                />
                <span style={{
                  flex: 1, fontSize: '14px', color: '#2C2416',
                  fontWeight: g.id === mainGoalId ? 600 : 400,
                }}>
                  {g.text}
                </span>
                {g.id === mainGoalId && (
                  <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9953A', fontWeight: 600 }}>Main</span>
                )}
                <button onClick={() => deleteQuitGoal(g.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#8C7A5A', fontSize: '18px', lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
          {quitGoals.length < 5 && (
            <div className="flex gap-2">
              <input
                value={quitInput}
                onChange={e => setQuitInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const t = quitInput.trim()
                    if (t) { addQuitGoal(t); setQuitInput('') }
                  }
                }}
                placeholder="e.g. Quit smoking, Stop drinking..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => { const t = quitInput.trim(); if (t) { addQuitGoal(t); setQuitInput('') } }}
                className="bg-stone-100 hover:bg-stone-200 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-700"
              >Add</button>
            </div>
          )}
        </Section>

        <Section title="What are you working on?" sub="Select all that apply.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADDICTION_OPTIONS.map(label => (
              <button key={label} onClick={() => toggle(addictions, setAddictions, label)}
                className={`flex items-center p-3 rounded-xl border text-sm font-medium transition-all text-left
                  ${addictions.includes(label) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="What have you always wanted to try?" sub="These become your Spark activities.">
          <div className="flex flex-wrap gap-2 mb-3">
            {SPARK_INTERESTS.map(item => (
              <button key={item} onClick={() => toggle(wantToTry, setWantToTry, item)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-all
                  ${wantToTry.includes(item) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customTry} onChange={e => setCustomTry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Add your own..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400" />
            <button onClick={addCustom} className="bg-stone-100 hover:bg-stone-200 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-700">Add</button>
          </div>
          {wantToTry.filter(i => !SPARK_INTERESTS.includes(i)).map(item => (
            <span key={item} className="inline-flex items-center gap-1.5 mt-2 mr-2 px-3 py-1.5 rounded-full border border-amber-400 bg-amber-50 text-amber-800 text-sm">
              {item}
              <button onClick={() => toggle(wantToTry, setWantToTry, item)} className="text-amber-500 hover:text-amber-700">×</button>
            </span>
          ))}
        </Section>

        <Section title="Current hobbies" sub="We use these to understand your world.">
          <textarea value={hobbies} onChange={e => setHobbies(e.target.value)}
            placeholder="e.g. hiking, cooking, reading thrillers, football..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 placeholder-stone-400 resize-none h-24 text-sm focus:outline-none focus:border-amber-400" />
        </Section>

        <Section title="Where are you in your journey?" sub="Helps Flare speak to you at the right level.">
          <div className="flex flex-col gap-2">
            {[
              { value: 'starting',         label: 'Just starting out',              sub: 'This is my first real attempt' },
              { value: 'tried_before',     label: "I've tried before",              sub: "I know what it's like but haven't cracked it yet" },
              { value: 'been_at_it',       label: "Been at it a while",             sub: "I've had longer stretches of success" },
              { value: 'relapsed_restart', label: "I relapsed — starting again",    sub: "I know the pattern, I'm getting back up" },
            ].map(({ value, label, sub }) => (
              <button key={value} onClick={() => setJourneyStage(value)}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all
                  ${journeyStage === value ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300'}`}>
                <span className={`text-sm font-semibold ${journeyStage === value ? 'text-amber-800' : 'text-stone-700'}`}>{label}</span>
                <span className={`text-xs mt-0.5 ${journeyStage === value ? 'text-amber-600' : 'text-stone-400'}`}>{sub}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="What's gotten in the way before?" sub="Flare will watch for these patterns and offer targeted support.">
          <div className="flex flex-wrap gap-2 mb-3">
            {['Stress', 'Boredom', 'Social pressure', 'Physical cravings', 'Loneliness', 'Anxiety', 'Routine triggers', 'Emotional pain', 'Celebrations', 'Insomnia'].map(b => (
              <button key={b} onClick={() => toggle(blockers, setBlockers, b)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-all
                  ${blockers.includes(b) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                {b}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customBlocker} onChange={e => setCustomBlocker(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { const t = customBlocker.trim(); if (t && !blockers.includes(t)) { setBlockers(p => [...p, t]); setCustomBlocker('') } } }}
              placeholder="Add your own…"
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400" />
            <button onClick={() => { const t = customBlocker.trim(); if (t && !blockers.includes(t)) { setBlockers(p => [...p, t]); setCustomBlocker('') } }}
              className="bg-stone-100 hover:bg-stone-200 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-700">Add</button>
          </div>
        </Section>

        <Section title="Topics that feel heavy" sub="Flare will never bring these up. Separate with commas.">
          <textarea value={heavyTopics} onChange={e => setHeavyTopics(e.target.value)}
            placeholder="e.g. cooking (reminds me of someone), bars, casinos..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 placeholder-stone-400 resize-none h-24 text-sm focus:outline-none focus:border-amber-400" />
        </Section>

        <Section title="Companion voice" sub="Who speaks to you when you need it most.">
          <VoicePicker />
        </Section>

        <Section title="Recovery stake" sub="Put skin in the game — earn your deposit back one session at a time.">
          <RecoveryStake />
        </Section>

        {user?.support_code && (
          <Section title="Support circle" sub="Share with someone you trust.">
            <div className="flex items-center justify-between gap-4 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <span className="text-amber-600 text-sm font-mono truncate">{window.location.origin}/support/{user.support_code}</span>
              <button onClick={copySupport} className="text-stone-500 hover:text-stone-800 text-sm shrink-0 font-medium">Copy</button>
            </div>
          </Section>
        )}

        <button onClick={handleSave} disabled={saving}
          className={`w-full font-bold py-4 rounded-xl transition-all text-base
            ${saved ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-500 text-black'} disabled:opacity-50`}>
          {saved ? 'Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>

        <button onClick={logout} className="text-stone-400 hover:text-stone-600 text-sm text-center transition-colors pb-8">
          Sign out
        </button>
      </div>
    </Layout>
  )
}

function Section({ title, sub, children }) {
  return (
    <div>
      <h2 className="text-stone-800 font-semibold text-lg mb-0.5">{title}</h2>
      {sub && <p className="text-stone-400 text-sm mb-4">{sub}</p>}
      {children}
    </div>
  )
}

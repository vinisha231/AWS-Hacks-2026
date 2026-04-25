import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useEmberStore } from '../store/emberStore'
import Layout from '../components/Layout'
import VoicePicker from '../components/VoicePicker'

const ADDICTION_OPTIONS = [
  { label: 'Nicotine',     emoji: '🚬' },
  { label: 'Alcohol',      emoji: '🍺' },
  { label: 'Cannabis',     emoji: '🌿' },
  { label: 'Gambling',     emoji: '🎰' },
  { label: 'Social media', emoji: '📱' },
  { label: 'Gaming',       emoji: '🎮' },
  { label: 'Opioids',      emoji: '💊' },
  { label: 'Food',         emoji: '🍔' },
  { label: 'Shopping',     emoji: '🛍️' },
  { label: 'Other',        emoji: '•'  },
]

const SPARK_INTERESTS = [
  'Drawing', 'Poetry', 'Origami', 'Coding', 'Languages', 'Magic tricks',
  'Photography', 'Music', 'Astronomy', 'History', 'Philosophy', 'Puzzles',
  'Cooking new things', 'Gardening', 'Writing', 'Chess',
]

export default function Profile() {
  const { user: authUser, logout } = useAuth()
  const { user, setUser, setFlaggedTriggers } = useEmberStore()

  const [addictions, setAddictions] = useState([])
  const [wantToTry, setWantToTry] = useState([])
  const [customTry, setCustomTry] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [heavyTopics, setHeavyTopics] = useState('')
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
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const copySupport = () => {
    if (user?.support_code)
      navigator.clipboard.writeText(`${window.location.origin}/support/${user.support_code}`)
  }

  return (
    <Layout>
      <div className="max-w-2xl flex flex-col gap-10">
        <div>
          <h1 className="text-3xl font-black mb-1">Profile</h1>
          <p className="text-stone-500">Everything stays private. We use this to personalise your sparks.</p>
          {authUser?.username && (
            <p className="text-stone-600 text-sm mt-1">Signed in as <span className="text-stone-400 font-medium">{authUser.username}</span></p>
          )}
        </div>

        <Section title="What are you working on?" sub="Select all that apply.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADDICTION_OPTIONS.map(({ label, emoji }) => (
              <button key={label} onClick={() => toggle(addictions, setAddictions, label)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left
                  ${addictions.includes(label) ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-white/8 text-stone-400 hover:border-white/20 hover:text-white'}`}>
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="What have you always wanted to try?" sub="These become your Spark activities.">
          <div className="flex flex-wrap gap-2 mb-3">
            {SPARK_INTERESTS.map(item => (
              <button key={item} onClick={() => toggle(wantToTry, setWantToTry, item)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-all
                  ${wantToTry.includes(item) ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-white/8 text-stone-500 hover:border-white/20 hover:text-white'}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customTry} onChange={e => setCustomTry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Add your own..."
              className="flex-1 bg-stone-800 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/50" />
            <button onClick={addCustom} className="bg-stone-800 hover:bg-stone-700 border border-white/8 px-4 py-2.5 rounded-xl text-sm font-medium text-white">Add</button>
          </div>
          {wantToTry.filter(i => !SPARK_INTERESTS.includes(i)).map(item => (
            <span key={item} className="inline-flex items-center gap-1.5 mt-2 mr-2 px-3 py-1.5 rounded-full border border-amber-500 bg-amber-500/10 text-amber-300 text-sm">
              {item}
              <button onClick={() => toggle(wantToTry, setWantToTry, item)} className="text-amber-500 hover:text-amber-300">×</button>
            </span>
          ))}
        </Section>

        <Section title="Current hobbies" sub="We use these to understand your world.">
          <textarea value={hobbies} onChange={e => setHobbies(e.target.value)}
            placeholder="e.g. hiking, cooking, reading thrillers, football..."
            className="w-full bg-stone-800 border border-white/8 rounded-xl p-4 text-white placeholder-stone-600 resize-none h-24 text-sm focus:outline-none focus:border-amber-500/50" />
        </Section>

        <Section title="Topics that feel heavy" sub="Ember will never bring these up. Separate with commas.">
          <textarea value={heavyTopics} onChange={e => setHeavyTopics(e.target.value)}
            placeholder="e.g. cooking (reminds me of someone), bars, casinos..."
            className="w-full bg-stone-800 border border-white/8 rounded-xl p-4 text-white placeholder-stone-600 resize-none h-24 text-sm focus:outline-none focus:border-amber-500/50" />
        </Section>

        <Section title="Companion voice" sub="Who speaks to you when you need it most.">
          <VoicePicker />
        </Section>

        {user?.support_code && (
          <Section title="Support circle" sub="Share with someone you trust.">
            <div className="flex items-center justify-between gap-4 bg-stone-800 border border-white/8 rounded-xl px-4 py-3">
              <span className="text-amber-400 text-sm font-mono truncate">{window.location.origin}/support/{user.support_code}</span>
              <button onClick={copySupport} className="text-stone-400 hover:text-white text-sm shrink-0 font-medium">Copy</button>
            </div>
          </Section>
        )}

        <button onClick={handleSave} disabled={saving}
          className={`w-full font-bold py-4 rounded-xl transition-all text-base
            ${saved ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'} disabled:opacity-50`}>
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>

        <button onClick={logout} className="text-stone-600 hover:text-stone-400 text-sm text-center transition-colors pb-8">
          Sign out
        </button>
      </div>
    </Layout>
  )
}

function Section({ title, sub, children }) {
  return (
    <div>
      <h2 className="text-white font-semibold text-lg mb-0.5">{title}</h2>
      {sub && <p className="text-stone-500 text-sm mb-4">{sub}</p>}
      {children}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { supabase } from '../lib/supabase'
import { useEmberStore } from '../store/emberStore'

const ADDICTION_OPTIONS = [
  { label: 'Nicotine', emoji: '🚬' },
  { label: 'Alcohol', emoji: '🍺' },
  { label: 'Cannabis', emoji: '🌿' },
  { label: 'Gambling', emoji: '🎰' },
  { label: 'Social media', emoji: '📱' },
  { label: 'Gaming', emoji: '🎮' },
  { label: 'Opioids', emoji: '💊' },
  { label: 'Food', emoji: '🍔' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Other', emoji: '•' },
]

const SPARK_INTERESTS = [
  'Drawing', 'Poetry', 'Origami', 'Coding',
  'Languages', 'Magic tricks', 'Photography', 'Music',
  'Astronomy', 'History', 'Philosophy', 'Puzzles',
  'Cooking new things', 'Gardening', 'Writing', 'Chess',
]

export default function Profile() {
  const navigate = useNavigate()
  const { user: auth0User } = useAuth0()
  const { user, setUser, setSparkProfile, setFlaggedTriggers } = useEmberStore()

  const [addictions, setAddictions] = useState([])
  const [wantToTry, setWantToTry] = useState([])
  const [customTry, setCustomTry] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [heavyTopics, setHeavyTopics] = useState('')
  const [supportCode, setSupportCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setAddictions(user.addiction_type ? user.addiction_type.split(',').map(s => s.trim()) : [])
    setSupportCode(user.support_code || '')
  }, [user])

  const toggleAddiction = (label) => {
    setAddictions(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    )
  }

  const toggleWantToTry = (item) => {
    setWantToTry(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const addCustomTry = () => {
    const trimmed = customTry.trim()
    if (trimmed && !wantToTry.includes(trimmed)) {
      setWantToTry(prev => [...prev, trimmed])
      setCustomTry('')
    }
  }

  const handleSave = async () => {
    if (!auth0User) return
    setSaving(true)

    const addictionStr = addictions.join(', ')
    const heavyArr = heavyTopics.split(',').map(s => s.trim()).filter(Boolean)
    const sparkCuriosities = [...wantToTry, ...hobbies.split(',').map(s => s.trim()).filter(Boolean)]

    const { data } = await supabase.from('users')
      .update({ addiction_type: addictionStr })
      .eq('auth0_id', auth0User.sub)
      .select().single()

    if (data) setUser(data)

    if (heavyArr.length > 0 && user?.id) {
      await Promise.all(
        heavyArr.map(topic =>
          supabase.from('flagged_triggers')
            .upsert({ user_id: user.id, topic, reason: 'user_set' }, { onConflict: 'user_id,topic' })
            .then(() => {})
        )
      )
      setFlaggedTriggers(heavyArr)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const copySupport = () => {
    navigator.clipboard.writeText(`${window.location.origin}/support/${supportCode}`)
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <header className="flex items-center justify-between p-6 border-b border-stone-800">
        <button onClick={() => navigate('/home')} className="text-stone-400 hover:text-white transition-colors flex items-center gap-2">
          <span>←</span> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-bold">Profile</span>
        </div>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto p-6 flex flex-col gap-8 pb-24">

        {/* What you're working on */}
        <section>
          <h2 className="text-lg font-semibold mb-1">What are you working on?</h2>
          <p className="text-stone-500 text-sm mb-4">Select all that apply. No judgment here.</p>
          <div className="grid grid-cols-2 gap-2">
            {ADDICTION_OPTIONS.map(({ label, emoji }) => (
              <button
                key={label}
                onClick={() => toggleAddiction(label)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left
                  ${addictions.includes(label)
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </section>

        {/* Spark interests */}
        <section>
          <h2 className="text-lg font-semibold mb-1">What have you always wanted to try?</h2>
          <p className="text-stone-500 text-sm mb-4">These become your Spark activities — fresh territory with no baggage.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SPARK_INTERESTS.map(item => (
              <button
                key={item}
                onClick={() => toggleWantToTry(item)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-all
                  ${wantToTry.includes(item)
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-stone-700 text-stone-500 hover:border-stone-500'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customTry}
              onChange={e => setCustomTry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomTry()}
              placeholder="Add your own..."
              className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={addCustomTry}
              className="bg-stone-800 hover:bg-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              Add
            </button>
          </div>
          {wantToTry.filter(i => !SPARK_INTERESTS.includes(i)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {wantToTry.filter(i => !SPARK_INTERESTS.includes(i)).map(item => (
                <span key={item} className="px-3 py-1.5 rounded-full border border-amber-500 bg-amber-500/10 text-amber-300 text-sm flex items-center gap-1">
                  {item}
                  <button onClick={() => toggleWantToTry(item)} className="text-amber-500 hover:text-amber-300 ml-1">×</button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Current hobbies */}
        <section>
          <h2 className="text-lg font-semibold mb-1">Current hobbies or interests</h2>
          <p className="text-stone-500 text-sm mb-3">We use these to understand your world — not to suggest them during cravings.</p>
          <textarea
            value={hobbies}
            onChange={e => setHobbies(e.target.value)}
            placeholder="e.g. hiking, cooking, reading thrillers, watching football..."
            className="w-full bg-stone-900 border border-stone-700 rounded-xl p-4 text-white placeholder-stone-600 resize-none h-24 text-sm focus:outline-none focus:border-amber-500"
          />
        </section>

        {/* Heavy topics */}
        <section>
          <h2 className="text-lg font-semibold mb-1">Topics that feel heavy</h2>
          <p className="text-stone-500 text-sm mb-3">Ember will never suggest anything linked to these. Separate with commas.</p>
          <textarea
            value={heavyTopics}
            onChange={e => setHeavyTopics(e.target.value)}
            placeholder="e.g. cooking (reminds me of someone), bars, casinos..."
            className="w-full bg-stone-900 border border-stone-700 rounded-xl p-4 text-white placeholder-stone-600 resize-none h-24 text-sm focus:outline-none focus:border-amber-500"
          />
        </section>

        {/* Support circle */}
        {supportCode && (
          <section>
            <h2 className="text-lg font-semibold mb-1">Support circle</h2>
            <p className="text-stone-500 text-sm mb-3">Share this link with someone you trust. They'll see your progress — no personal details.</p>
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <span className="text-amber-400 text-sm font-mono truncate">
                {window.location.origin}/support/{supportCode}
              </span>
              <button
                onClick={copySupport}
                className="text-stone-400 hover:text-white text-sm shrink-0 transition-colors"
              >
                Copy
              </button>
            </div>
          </section>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full font-bold py-4 rounded-2xl transition-all text-lg
            ${saved
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
            } disabled:opacity-50`}
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>
      </main>
    </div>
  )
}

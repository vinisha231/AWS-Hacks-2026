import { useState, useRef, useEffect } from 'react'
import { generateLetter, roleplayTurn } from '../services/advocateApi'
import { useStore } from '../store/store'

export function AdvocatePanel({ program, onClose }) {
  const { answers } = useStore()
  const [mode, setMode] = useState(null)          // null | 'letter' | 'roleplay'
  const [loading, setLoading] = useState(false)
  const [letter, setLetter] = useState('')
  const [talkingPoints, setTalkingPoints] = useState([])
  const [objections, setObjections] = useState([])
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  const programName = program.nameKey || program.name || program.id
  const programFull = program.fullKey || program.fullName || programName

  const startLetter = async () => {
    setMode('letter')
    setLoading(true)
    try {
      const data = await generateLetter({
        programName, programFull,
        userName: answers?.name || 'the applicant',
        profile: answers || {},
      })
      setLetter(data.letter || '')
      setTalkingPoints(data.talking_points || [])
      setObjections(data.objections || [])
    } catch (e) {
      setLetter('Error generating letter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startRoleplay = async () => {
    setMode('roleplay')
    setLoading(true)
    try {
      const data = await roleplayTurn({ programName, profile: answers || {}, message: '', history: [] })
      setChat([{ role: 'assistant', content: data.reply }])
    } catch (e) {
      setChat([{ role: 'assistant', content: 'Error starting session. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const sendRoleplay = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const newChat = [...chat, userMsg]
    setChat(newChat)
    setInput('')
    setLoading(true)
    try {
      const history = newChat.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const data = await roleplayTurn({ programName, profile: answers || {}, message: input, history })
      setChat(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setChat(prev => [...prev, { role: 'assistant', content: 'Error — please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const copyLetter = () => {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div>
            <h2 className="font-black text-gray-900 text-lg">AI Benefits Advocate</h2>
            <p className="text-sm text-gray-500">{programFull}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode picker */}
        {!mode && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <p className="text-gray-600 text-center text-sm max-w-sm">
              Get professional help applying for <strong>{programName}</strong>. Choose how you'd like to prepare.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <button
                onClick={startLetter}
                className="group flex flex-col gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <span className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold text-gray-900">Generate Advocacy Letter</p>
                  <p className="text-xs text-gray-500 mt-1">A formal persuasive letter + talking points for your caseworker meeting</p>
                </div>
              </button>

              <button
                onClick={startRoleplay}
                className="group flex flex-col gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <span className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold text-gray-900">Practice with Mock Officer</p>
                  <p className="text-xs text-gray-500 mt-1">Roleplay a caseworker interview so you're ready for the real thing</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Letter mode */}
        {mode === 'letter' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-500">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
                Generating your advocacy letter…
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Letter */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {letter}
                  </pre>
                </div>

                {/* Talking points */}
                {talkingPoints.length > 0 && (
                  <div className="px-6 pb-4 border-t border-gray-100 pt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Key Talking Points</p>
                    <ul className="space-y-1.5">
                      {talkingPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-emerald-600 font-bold mt-0.5">•</span>{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Objections */}
                {objections.length > 0 && (
                  <div className="px-6 pb-4 border-t border-gray-100 pt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Common Objections & Responses</p>
                    <ul className="space-y-1.5">
                      {objections.map((obj, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-amber-600 font-bold mt-0.5">→</span>{obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="px-6 pb-6 pt-4 border-t border-gray-200 flex gap-3">
                  <button onClick={copyLetter} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors">
                    {copied ? '✓ Copied!' : 'Copy Letter'}
                  </button>
                  <button onClick={() => { setMode(null); setLetter('') }} className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roleplay mode */}
        {mode === 'roleplay' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
              <p className="text-xs text-amber-700 font-medium text-center">
                🎭 You're practicing with a simulated {answers?.state || ''} caseworker. Respond as you would in the real interview.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mr-2 mt-0.5">CW</span>
                  )}
                  <div className={`max-w-sm px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2.5 rounded-xl flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendRoleplay()}
                  placeholder="Your response to the caseworker…"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
                />
                <button onClick={sendRoleplay} disabled={loading || !input.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 text-white px-4 py-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { generateLetter, roleplayTurn } from '../services/advocateApi'
import { useStore } from '../store/store'

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/---+/g, '')
    .trim()
}

export function AdvocatePanel({ program, onClose }) {
  const { answers } = useStore()
  const [mode, setMode] = useState(null)          // null | 'letter' | 'roleplay' | 'documents' | 'denials' | 'fallback'
  const [loading, setLoading] = useState(false)
  const [letter, setLetter] = useState('')
  const [talkingPoints, setTalkingPoints] = useState([])
  const [objections, setObjections] = useState([])
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [backendError, setBackendError] = useState(null)
  const [copied, setCopied] = useState(false)
  const chatContainerRef = useRef(null)

  // Scroll only the chat messages div, not the page
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chat, loading])

  const programName = program.nameKey || program.name || program.id
  const programFull = program.fullKey || program.fullName || programName

  const startLetter = async () => {
    setMode('letter')
    setBackendError(null)
    setLoading(true)
    try {
      const data = await generateLetter({
        programName, programFull,
        userName: answers?.name || 'the applicant',
        profile: answers || {},
      })
      setLetter(stripMarkdown(data.letter || ''))
      setTalkingPoints((data.talking_points || []).map(stripMarkdown))
      setObjections((data.objections || []).map(stripMarkdown))
    } catch (e) {
      setBackendError(e?.message || 'Advocate service unavailable')
      setMode('fallback')
    } finally {
      setLoading(false)
    }
  }

  const startRoleplay = async () => {
    setMode('roleplay')
    setBackendError(null)
    setLoading(true)
    try {
      const data = await roleplayTurn({ programName, profile: answers || {}, message: '', history: [] })
      setChat([{ role: 'assistant', content: stripMarkdown(data.reply) }])
    } catch (e) {
      setBackendError(e?.message || 'Could not start the roleplay session')
      setMode('fallback')
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
      setChat(prev => [...prev, { role: 'assistant', content: stripMarkdown(data.reply) }])
    } catch (e) {
      setBackendError(e?.message || 'The session failed. Showing fallback help instead.')
      setMode('fallback')
    } finally {
      setLoading(false)
    }
  }

  const copyLetter = () => {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal — flex column with fixed max height so inner sections can scroll */}
      <div
        className="relative bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — never scrolls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 rounded-t-xl">
          <div>
              <h2 className="font-black text-gray-900 text-lg">AI Benefits Advocate — Documents, Denials, Form Help</h2>
              <p className="text-sm text-gray-500">{programFull} · Ask for documents, common denial reasons, or practice filing.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode picker */}
        {!mode && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 overflow-y-auto">
            <p className="text-gray-600 text-center text-sm max-w-sm">
              Get practical help for <strong>{programName}</strong>. Choose what you need: documents, denial explanations, or application prep.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              <button
                onClick={() => setMode('documents')}
                className="group flex flex-col gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-gray-900">Documents Checklist</p>
                  <p className="text-xs text-gray-500 mt-1">See the exact documents you'll need to apply</p>
                </div>
              </button>

              <button
                onClick={() => setMode('denials')}
                className="group flex flex-col gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-gray-900">Explain Denial Reasons</p>
                  <p className="text-xs text-gray-500 mt-1">Understand common reasons an application is denied and how to address them</p>
                </div>
              </button>

              <button
                onClick={startRoleplay}
                className="group flex flex-col gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-gray-900">Practice with Mock Officer</p>
                  <p className="text-xs text-gray-500 mt-1">Roleplay a caseworker interview so you're ready for the real thing</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Letter mode — min-h-0 lets flex children shrink so scroll works */}
        {mode === 'letter' && (
          <div className="flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-500">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
                Generating your advocacy letter…
              </div>
            ) : (
              <>
                {/* Scrollable letter area */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {letter}
                  </pre>

                  {talkingPoints.length > 0 && (
                    <div className="mt-4">
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

                  {objections.length > 0 && (
                    <div className="mt-4">
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
                </div>

                {/* Actions — pinned to bottom */}
                <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-200 flex gap-3">
                  <button onClick={copyLetter} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors">
                    {copied ? '✓ Copied!' : 'Copy Letter'}
                  </button>
                  <button onClick={() => { setMode(null); setLetter('') }} className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Roleplay mode */}
        {mode === 'roleplay' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border-b border-amber-200">
              <p className="text-xs text-amber-700 font-medium text-center">
                🎭 You're practicing with a simulated {answers?.state || ''} caseworker. Respond as you would in the real interview.
              </p>
            </div>

            {/* Messages — only this div scrolls */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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
            </div>

            {/* Input — pinned to bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
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
        {mode === 'fallback' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="rounded-2xl border border-amber-500 bg-amber-950/20 p-5 text-amber-100">
              <p className="font-bold">AI Advocate fallback mode</p>
              <p className="mt-2 text-sm">{backendError || 'The simulated caseworker session is unavailable right now.'}</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-4">
                <p className="text-sm font-semibold text-white">What you can do instead</p>
                <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                  <li>• Review the program documents checklist for this benefit.</li>
                  <li>• Read common denial reasons before you submit.</li>
                  <li>• Use the static Q&A below for quick help.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-4 space-y-3">
                <p className="text-sm text-neutral-400 uppercase tracking-wide">Quick help</p>
                <div className="space-y-2 text-sm text-neutral-200">
                  <p><strong>Q:</strong> What documentation matters most? <br /><strong>A:</strong> Income proof and program-specific eligibility evidence are the most common requirements.</p>
                  <p><strong>Q:</strong> What if I need help today? <br /><strong>A:</strong> Use local food banks, rent relief, and 211/United Way resources while you wait.</p>
                  <p><strong>Q:</strong> Can I still apply without the chat? <br /><strong>A:</strong> Yes — gather documents and submit through the program page.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('documents')}
                className="flex-1 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                View documents checklist
              </button>
              <button
                onClick={() => setMode(null)}
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-semibold text-neutral-200 hover:border-neutral-500 transition-colors"
              >
                Continue without chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

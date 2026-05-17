import { useState, useRef, useEffect } from 'react'
import { chatWithBot } from '../services/chatbotApi'

const FALLBACK_QA = [
  { q: 'What documents are commonly required?', a: 'Most programs ask for ID, proof of income, proof of residency, and household member information.' },
  { q: 'How do I check if I qualify?', a: 'Start with income and household size, then confirm special eligibility like disability, pregnancy, or veteran status.' },
  { q: 'What if I need help today?', a: 'Look for local food banks, emergency rent assistance, and 211/United Way referrals.' },
]

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/---+/g, '')
    .trim()
}

export function ProgramChatbot({ programId, programName }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendError, setBackendError] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading || backendError) return
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const data = await chatWithBot(text, programId, programName)
      const reply = stripMarkdown(data.reply || data.response || 'No response received.')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error('Chatbot error:', err)
      setBackendError(err?.message || 'Assistant unavailable')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Assistant unavailable. Showing a static fallback guide instead.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden flex flex-col h-96">
      <div className="flex items-center gap-2 bg-neutral-900 px-4 py-3 border-b border-neutral-700">
        <span className="w-6 h-6 rounded bg-emerald-900 border border-emerald-700 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          </svg>
        </span>
        <span className="font-semibold text-white text-sm truncate">{programName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {backendError ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-600 bg-amber-950/30 p-4 text-sm text-amber-100">
              <p className="font-semibold">Offline support activated</p>
              <p className="mt-2 text-xs text-amber-200">{backendError}</p>
            </div>
            <div className="space-y-2">
              {FALLBACK_QA.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-neutral-700 bg-neutral-900 p-4">
                  <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Q</p>
                  <p className="text-sm text-white font-semibold">{item.q}</p>
                  <p className="mt-2 text-sm text-neutral-300">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="text-xs text-neutral-500">You can still use the documents checklist or continue without chat mode.</div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center text-neutral-500 text-sm mt-8">
                Ask about eligibility, documents, or how to apply
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-neutral-700 text-neutral-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-700 px-4 py-2.5 rounded-lg flex gap-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-neutral-700 p-3 bg-neutral-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={backendError ? 'Chat unavailable' : 'Ask a question...'}
            disabled={Boolean(backendError)}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || Boolean(backendError)}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-3 py-2 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

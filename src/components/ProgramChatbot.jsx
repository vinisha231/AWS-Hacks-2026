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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-96 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 border-b border-gray-200">
        <span className="w-6 h-6 rounded bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          </svg>
        </span>
        <span className="font-bold text-gray-900 text-sm truncate">Ask about {programName}</span>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {backendError ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-bold">Offline support activated</p>
              <p className="mt-1 text-xs">{backendError}</p>
            </div>
            <div className="space-y-2">
              {FALLBACK_QA.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Q</p>
                  <p className="text-sm text-gray-900 font-bold">{item.q}</p>
                  <p className="mt-1 text-sm text-gray-700">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                Ask about eligibility, documents, or how to apply
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-xl text-sm leading-relaxed font-medium ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-900'
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
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={backendError ? 'Chat unavailable' : 'Ask a question…'}
            disabled={Boolean(backendError)}
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || Boolean(backendError)}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white px-3 py-2 rounded-lg transition-colors"
          >
            {/* Right-pointing arrow */}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

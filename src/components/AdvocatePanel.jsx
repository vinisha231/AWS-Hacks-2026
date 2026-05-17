import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { generateLetter, roleplayTurn } from '../services/advocateApi'
import { speakText, stopSpeaking, langToBCP47 } from '../services/pollyApi'
import { useStore } from '../store/store'
import jsPDF from 'jspdf'
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx'

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/---+/g, '')
    .trim()
}

function MicIcon({ active }) {
  return active ? (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" fill="#ef4444" opacity="0.15" />
      <path d="M10 2a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z" />
      <path d="M7 14.93A6 6 0 0013 14.93M10 17v2M8 19h4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 2a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 14.93A6 6 0 0013 14.93M10 17v2M8 19h4" />
    </svg>
  )
}

function SpeakerIcon({ muted }) {
  return muted ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 9l-5.25 5.25" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  )
}

export function AdvocatePanel({ program, onClose }) {
  const { answers } = useStore()
  const lang = useStore(s => s.language) || 'en'
  const [mode, setMode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [letter, setLetter] = useState('')
  const [talkingPoints, setTalkingPoints] = useState([])
  const [objections, setObjections] = useState([])
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [backendError, setBackendError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const chatContainerRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chat, loading])

  // Auto-play caseworker messages via Polly
  useEffect(() => {
    if (!autoSpeak || loading || chat.length === 0) return
    const last = chat[chat.length - 1]
    if (last.role === 'assistant') {
      setSpeaking(true)
      speakText(last.content, lang)
        .catch(() => {})
        .finally(() => setSpeaking(false))
    }
  }, [chat])

  // Stop audio on close
  useEffect(() => () => stopSpeaking(), [])

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
    } catch {
      setLetter('Error generating letter. Please try again.')
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
    } catch {
      setChat([{ role: 'assistant', content: 'Error starting session. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const sendRoleplay = async () => {
    if (!input.trim() || loading) return
    stopSpeaking()
    const userMsg = { role: 'user', content: input }
    const newChat = [...chat, userMsg]
    setChat(newChat)
    setInput('')
    setLoading(true)
    try {
      const history = newChat.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const data = await roleplayTurn({ programName, profile: answers || {}, message: input, history })
      setChat(prev => [...prev, { role: 'assistant', content: stripMarkdown(data.reply) }])
    } catch {
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

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(letter, 175)
    let y = 20
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, 18, y)
      y += 6
    })
    doc.save(`advocacy-letter-${programName.replace(/\s+/g, '-')}.pdf`)
  }

  const downloadDOCX = async () => {
    const paragraphs = letter.split('\n\n').map(para =>
      new Paragraph({
        children: [new TextRun({ text: para.replace(/\n/g, ' '), size: 24 })],
        spacing: { after: 200 },
      })
    )
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: `Advocacy Letter — ${programFull}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),
          ...paragraphs,
        ],
      }],
    })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `advocacy-letter-${programName.replace(/\s+/g, '-')}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleListen = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }
    stopSpeaking()
    const rec = new SR()
    rec.lang = langToBCP47(lang)
    rec.interimResults = true
    rec.maxAlternatives = 1
    recognitionRef.current = rec
    setListening(true)

    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setInput(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
  }

  const replayMessage = (text) => {
    setSpeaking(true)
    speakText(text, lang)
      .catch(() => {})
      .finally(() => setSpeaking(false))
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 rounded-t-xl">
          <div>
              <h2 className="font-black text-gray-900 text-lg">AI Benefits Advocate — Documents, Denials, Form Help</h2>
              <p className="text-sm text-gray-500">{programFull} · Ask for documents, common denial reasons, or practice filing.</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'roleplay' && (
              <button
                onClick={() => { setAutoSpeak(v => !v); if (autoSpeak) stopSpeaking() }}
                title={autoSpeak ? 'Mute caseworker' : 'Unmute caseworker'}
                className={`p-2 rounded-lg border transition-colors ${autoSpeak ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-400 hover:text-gray-700'}`}
              >
                <SpeakerIcon muted={!autoSpeak} />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
                  <p className="text-xs text-gray-500 mt-1">Voice roleplay with a caseworker — speak your answers out loud</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Letter mode */}
        {mode === 'letter' && (
          <div className="flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-500">
                <span className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
                Generating your advocacy letter…
              </div>
            ) : (
              <>
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

                {/* Actions */}
                <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  <button onClick={copyLetter} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors min-w-[120px]">
                    {copied ? '✓ Copied!' : 'Copy Letter'}
                  </button>
                  <button onClick={downloadPDF} className="flex items-center gap-1.5 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    PDF
                  </button>
                  <button onClick={downloadDOCX} className="flex items-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    DOCX
                  </button>
                  <button onClick={() => { setMode(null); setLetter('') }} className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
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
            <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2">
              <p className="text-xs text-amber-700 font-medium">
                Practicing with a simulated {answers?.state || ''} caseworker — speak or type your answers
              </p>
              {speaking && (
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Speaking…
                </span>
              )}
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-1`}>
                  {msg.role === 'assistant' && (
                    <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mb-0.5">CW</span>
                  )}
                  <div className={`max-w-sm px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => replayMessage(msg.content)}
                      title="Replay audio"
                      className="text-gray-400 hover:text-emerald-600 flex-shrink-0 mb-0.5 p-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                    </button>
                  )}
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

            {/* Input with mic */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <button
                  onClick={toggleListen}
                  title={listening ? 'Stop listening' : `Speak in ${lang.toUpperCase()}`}
                  className={`px-3 py-2.5 rounded-lg border transition-colors flex-shrink-0 ${
                    listening
                      ? 'border-red-400 bg-red-50 text-red-600 animate-pulse'
                      : 'border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >
                  <MicIcon active={listening} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendRoleplay()}
                  placeholder={listening ? 'Listening…' : 'Your response to the caseworker…'}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-emerald-500"
                />
                <button onClick={sendRoleplay} disabled={loading || !input.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 text-white px-4 py-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">
                Mic language: {lang.toUpperCase()} · Tap mic to speak, tap again to stop
              </p>
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

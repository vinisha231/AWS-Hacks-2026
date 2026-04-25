import { useState, useEffect, useRef } from 'react'
import { useEmberStore } from '../store/emberStore'
import { getSocket, disconnectSocket } from '../services/socket'
import Layout, { PageShell } from '../components/Layout'
import { MicIcon, WaveformIcon, HeartIcon, AlertIcon, CheckIcon } from '../components/Icons'

const PHASE = {
  IDLE: 'idle',
  WAITING: 'waiting',
  CONNECTED: 'connected',
  ENDED: 'ended',
}

export default function PeerConnect() {
  const { username } = useEmberStore()
  const [phase, setPhase] = useState(PHASE.IDLE)
  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [endReason, setEndReason] = useState('')
  const [modWarning, setModWarning] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)   // speech-to-text active

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const mediaRef = useRef(null)
  const mySocketId = useRef(null)
  const holdTimerRef = useRef(null)
  const speechRecRef = useRef(null)

  useEffect(() => {
    const sock = getSocket()
    socketRef.current = sock
    mySocketId.current = sock.id

    sock.on('connect', () => { mySocketId.current = sock.id })

    sock.on('peer:waiting', () => setPhase(PHASE.WAITING))
    sock.on('peer:cancelled', () => setPhase(PHASE.IDLE))

    sock.on('peer:matched', ({ roomId: rid }) => {
      setRoomId(rid)
      setPhase(PHASE.CONNECTED)
      setMessages([{ system: true, text: 'Connected with someone going through recovery too. You\'re both anonymous. Be kind.' }])
    })

    sock.on('peer:receive', ({ from, text, ts }) => {
      const mine = from === mySocketId.current
      setMessages(m => [...m, { mine, text, ts }])
    })

    sock.on('peer:audio', ({ audioBase64, mimeType }) => {
      try {
        const binary = atob(audioBase64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const blob = new Blob([bytes], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => URL.revokeObjectURL(url)
        audio.play().catch(() => {})
        setMessages(m => [...m, { mine: false, audio: url, ts: Date.now() }])
      } catch {}
    })

    sock.on('peer:moderated', ({ reason }) => {
      setModWarning(reason || 'Message blocked by moderation.')
      setTimeout(() => setModWarning(''), 4000)
    })

    sock.on('peer:ended', ({ reason }) => {
      setEndReason(reason || 'Session ended.')
      setPhase(PHASE.ENDED)
      setRoomId(null)
    })

    return () => {
      sock.off('peer:waiting')
      sock.off('peer:cancelled')
      sock.off('peer:matched')
      sock.off('peer:receive')
      sock.off('peer:audio')
      sock.off('peer:moderated')
      sock.off('peer:ended')
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const findPeer = () => {
    socketRef.current?.emit('peer:find', { username: username || 'Anonymous' })
    setPhase(PHASE.WAITING)
    setMessages([])
    setEndReason('')
    setModWarning('')
  }

  const cancelWait = () => {
    socketRef.current?.emit('peer:cancel')
  }

  const sendMessage = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || !roomId) return
    setInput('')
    socketRef.current?.emit('peer:message', { roomId, text })
  }

  const endSession = () => {
    if (roomId) socketRef.current?.emit('peer:end', { roomId })
    setPhase(PHASE.ENDED)
    setEndReason('You ended the session.')
  }

  // Tap = speech-to-text; hold 350ms = voice message
  const micDown = () => {
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null
      startVoice()
    }, 350)
  }

  const micUp = () => {
    if (holdTimerRef.current) {
      // Was a tap — do speech-to-text
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
      startSpeechToText()
    } else {
      // Was a hold — stop voice recording
      stopVoice()
    }
  }

  const startSpeechToText = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    speechRecRef.current = rec
    rec.onresult = e => {
      const text = e.results[0]?.[0]?.transcript || ''
      setInput(p => p ? p + ' ' + text : text)
    }
    rec.onend = () => setIsSpeaking(false)
    rec.onerror = () => setIsSpeaking(false)
    rec.start()
    setIsSpeaking(true)
  }

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const b64 = reader.result.split(',')[1]
          socketRef.current?.emit('peer:audio', { roomId, audioBase64: b64, mimeType: 'audio/webm' })
          const url = URL.createObjectURL(blob)
          setMessages(m => [...m, { mine: true, audio: url, ts: Date.now() }])
        }
        reader.readAsDataURL(blob)
        setIsRecording(false)
      }
      mediaRef.current = mr
      mr.start()
      setIsRecording(true)
    } catch {
      setModWarning('Microphone access denied.')
    }
  }

  const stopVoice = () => {
    mediaRef.current?.stop()
  }

  return (
    <Layout>
      <PageShell>
      <div className="flex flex-col gap-6">

        <div>
          <h1 className="text-3xl font-black mb-1">Peer Connect</h1>
          <p className="text-stone-500 text-sm">Talk anonymously with someone in recovery right now.</p>
        </div>

        {/* IDLE */}
        {phase === PHASE.IDLE && (
          <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <HeartIcon size={36} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold mb-2">You're not alone in this.</h2>
              <p className="text-stone-400 text-sm leading-relaxed max-w-xs">
                Connect with someone else fighting the same battle right now.
                Both of you stay completely anonymous. Text or voice — your choice.
              </p>
            </div>
            <div className="bg-stone-800 border border-white/[0.06] rounded-xl p-4 w-full text-left">
              <p className="text-stone-500 text-xs uppercase tracking-widest font-medium mb-2">Community rules</p>
              <ul className="text-stone-400 text-xs space-y-1">
                <li>· Stay anonymous — no real names, numbers, or addresses</li>
                <li>· Be kind — you're both going through something hard</li>
                <li>· Either of you can end the session at any time</li>
                <li>· Gemini monitors for safety — violations end the chat immediately</li>
              </ul>
            </div>
            <button onClick={findPeer}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all">
              Find someone to talk to
            </button>
          </div>
        )}

        {/* WAITING */}
        {phase === PHASE.WAITING && (
          <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-10 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <WaveformIcon size={36} className="text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Looking for someone…</h2>
              <p className="text-stone-500 text-sm">You'll be matched with whoever else is waiting right now.</p>
            </div>
            <button onClick={cancelWait}
              className="text-stone-600 hover:text-stone-400 text-sm transition-colors">
              Cancel
            </button>
          </div>
        )}

        {/* CONNECTED */}
        {phase === PHASE.CONNECTED && (
          <div className="flex flex-col gap-3">
            {/* Header bar */}
            <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-900/30 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">Anonymous peer connected</span>
              </div>
              <button onClick={endSession}
                className="text-stone-600 hover:text-red-400 text-xs transition-colors font-medium">
                End session
              </button>
            </div>

            {/* Moderation warning */}
            {modWarning && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertIcon size={16} className="text-red-400 shrink-0" />
                <p className="text-red-300 text-sm">{modWarning}</p>
              </div>
            )}

            {/* Message area */}
            <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-4 min-h-[320px] max-h-[420px] overflow-y-auto flex flex-col gap-2">
              {messages.map((msg, i) => {
                if (msg.system) {
                  return (
                    <div key={i} className="text-center py-3">
                      <span className="text-stone-600 text-xs bg-stone-800 px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                  )
                }
                if (msg.audio) {
                  return (
                    <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl px-3 py-2 max-w-[80%] ${msg.mine ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-stone-800 border border-white/[0.06]'}`}>
                        <p className="text-stone-500 text-xs mb-1">{msg.mine ? 'You' : 'Peer'} · voice</p>
                        <audio src={msg.audio} controls className="h-8" />
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed
                      ${msg.mine
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-50'
                        : 'bg-stone-800 border border-white/[0.06] text-stone-200'}`}>
                      {msg.text}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Say something…"
                className="flex-1 bg-stone-900 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/40 text-sm"
              />
              <button type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 rounded-xl transition-all disabled:opacity-40"
                disabled={!input.trim()}>
                Send
              </button>
              <button
                type="button"
                onMouseDown={micDown}
                onMouseUp={micUp}
                onTouchStart={micDown}
                onTouchEnd={micUp}
                title="Tap: speak to type  |  Hold: send voice message"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0
                  ${isRecording ? 'bg-red-500/20 border-2 border-red-500/50' :
                    isSpeaking  ? 'bg-violet-500/20 border-2 border-violet-500/50' :
                    'bg-stone-800 border border-white/[0.08] hover:border-white/20'}`}>
                <MicIcon size={18} className={isRecording ? 'text-red-400' : isSpeaking ? 'text-violet-400' : 'text-stone-400'} />
              </button>
            </form>
            <p className="text-stone-700 text-xs text-center">Tap mic to speak · Hold mic to send voice message</p>
          </div>
        )}

        {/* ENDED */}
        {phase === PHASE.ENDED && (
          <div className="bg-stone-900 border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
              <CheckIcon size={28} className="text-stone-400" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold mb-2">Session over.</h2>
              <p className="text-stone-400 text-sm">{endReason}</p>
            </div>
            <div className="bg-amber-950/40 border border-amber-900/30 rounded-xl p-4 w-full text-left">
              <p className="text-stone-300 text-sm leading-relaxed">
                Reaching out takes strength. Whatever was shared here, it mattered.
              </p>
            </div>
            <button onClick={findPeer}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all">
              Talk to someone else
            </button>
            <button onClick={() => setPhase(PHASE.IDLE)}
              className="text-stone-600 hover:text-stone-400 text-sm transition-colors">
              Back to waiting room
            </button>
          </div>
        )}
      </div>
      </PageShell>
    </Layout>
  )
}

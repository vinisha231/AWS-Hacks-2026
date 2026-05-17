import { useState, useRef, useEffect } from 'react'
import { chatWithBot } from '../services/chatbotApi'
import { translateText } from '../services/translate'
import { langToBCP47 } from '../services/pollyApi'
import { useStore } from '../store/store'

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/---+/g, '')
    .trim()
}

// Starter questions keyed by language code
const STARTERS_MAP = {
  en: ['What benefits can I qualify for?', 'How do I apply for SNAP?', 'What documents do I need?', 'How long does approval take?'],
  es: ['¿Qué beneficios puedo obtener?', '¿Cómo solicito SNAP?', '¿Qué documentos necesito?', '¿Cuánto tarda la aprobación?'],
  fr: ['Quelles aides puis-je obtenir?', 'Comment demander le SNAP?', 'Quels documents faut-il?', 'Combien de temps dure l\'approbation?'],
  hi: ['मुझे कौन से लाभ मिल सकते हैं?', 'SNAP के लिए कैसे आवेदन करें?', 'कौन से दस्तावेज़ चाहिए?', 'अनुमोदन में कितना समय लगता है?'],
  ar: ['ما المزايا التي يمكنني الحصول عليها؟', 'كيف أتقدم لـ SNAP؟', 'ما المستندات المطلوبة؟', 'كم تستغرق الموافقة؟'],
  zh: ['我能获得哪些福利？', '如何申请SNAP？', '需要哪些文件？', '审批需要多长时间？'],
  ta: ['என்ன நலன்கள் கிடைக்கும்?', 'SNAP க்கு எப்படி விண்ணப்பிப்பது?', 'என்ன ஆவணங்கள் தேவை?', 'அனுமதிக்கு எவ்வளவு நேரம் ஆகும்?'],
}

const GREETING_MAP = {
  en: "Hi! I'm your Rta benefits assistant. Ask me anything about government programs, eligibility, or how to apply.",
  es: '¡Hola! Soy tu asistente de beneficios Rta. Pregúntame sobre programas gubernamentales, elegibilidad o cómo aplicar.',
  fr: 'Bonjour! Je suis votre assistant Rta. Posez-moi des questions sur les programmes gouvernementaux, l\'éligibilité ou comment postuler.',
  hi: 'नमस्ते! मैं आपका Rta लाभ सहायक हूँ। सरकारी कार्यक्रमों, पात्रता, या आवेदन के बारे में पूछें।',
  ar: 'مرحباً! أنا مساعد Rta للمزايا. اسألني عن البرامج الحكومية والأهلية وكيفية التقديم.',
  zh: '您好！我是您的Rta福利助手。请询问有关政府计划、资格或如何申请的问题。',
  ta: 'வணக்கம்! நான் உங்கள் Rta நலன்கள் உதவியாளர். அரசு திட்டங்கள், தகுதி அல்லது விண்ணப்பிப்பது பற்றி கேளுங்கள்.',
}

const FOLLOWUP_MAP = {
  en: [
    ['What documents do I need?', 'How long does it take?', 'Can I apply online?'],
    ['What happens after I apply?', 'Who else can help me?', 'Are there other benefits?'],
    ['How do I check my status?', 'What if I get denied?', 'Is there a deadline?'],
  ],
  es: [
    ['¿Qué documentos necesito?', '¿Cuánto tiempo tarda?', '¿Puedo aplicar en línea?'],
    ['¿Qué pasa después de aplicar?', '¿Quién más puede ayudarme?', '¿Hay otros beneficios?'],
    ['¿Cómo verifico mi estado?', '¿Qué pasa si me niegan?', '¿Hay una fecha límite?'],
  ],
  fr: [
    ['Quels documents faut-il?', 'Combien de temps?', 'Puis-je postuler en ligne?'],
    ['Que se passe-t-il après?', 'Qui d\'autre peut m\'aider?', 'Y a-t-il d\'autres aides?'],
    ['Comment vérifier mon statut?', 'Que faire si refus?', 'Y a-t-il une date limite?'],
  ],
  hi: [
    ['कौन से दस्तावेज़ चाहिए?', 'कितना समय लगेगा?', 'क्या ऑनलाइन आवेदन हो सकता है?'],
    ['आवेदन के बाद क्या होगा?', 'और कौन मदद कर सकता है?', 'अन्य लाभ क्या हैं?'],
    ['स्थिति कैसे जांचें?', 'अगर अस्वीकृति हो तो?', 'कोई समय सीमा है?'],
  ],
  ar: [
    ['ما المستندات المطلوبة؟', 'كم يستغرق؟', 'هل يمكنني التقديم أونلاين؟'],
    ['ماذا يحدث بعد التقديم؟', 'من يمكنه مساعدتي؟', 'هل هناك مزايا أخرى؟'],
    ['كيف أتحقق من الحالة؟', 'ماذا لو رُفض طلبي؟', 'هل هناك موعد نهائي؟'],
  ],
  zh: [
    ['需要哪些文件？', '需要多长时间？', '可以在线申请吗？'],
    ['申请后会怎样？', '还有谁可以帮助我？', '还有其他福利吗？'],
    ['如何查询状态？', '被拒绝怎么办？', '有截止日期吗？'],
  ],
  ta: [
    ['என்ன ஆவணங்கள் தேவை?', 'எவ்வளவு நேரம் ஆகும்?', 'ஆன்லைனில் விண்ணப்பிக்கலாமா?'],
    ['விண்ணப்பித்த பிறகு என்ன?', 'வேறு யார் உதவலாம்?', 'வேறு நலன்கள் உள்ளதா?'],
    ['நிலையை எப்படி சரிபார்க்கலாம்?', 'மறுக்கப்பட்டால் என்ன?', 'கடைசி தேதி உள்ளதா?'],
  ],
}

const OFFLINE_MSG = {
  en: "I'm not connected to the backend right now. For benefits help, call 211 or visit benefits.gov. Ask me a question anyway and I'll do my best!",
  es: "No estoy conectado al servidor ahora. Para ayuda con beneficios, llame al 211 o visite benefits.gov.",
  fr: "Je ne suis pas connecté au serveur. Pour les aides, appelez le 211 ou visitez benefits.gov.",
  hi: "अभी सर्वर से कनेक्ट नहीं हूँ। मदद के लिए 211 पर कॉल करें या benefits.gov पर जाएं।",
  ar: "لست متصلاً بالخادم الآن. للمساعدة، اتصل بـ 211 أو زر benefits.gov.",
  zh: "目前无法连接服务器。如需帮助，请拨打211或访问benefits.gov。",
  ta: "இப்போது சர்வரில் இணைக்கப்படவில்லை. உதவிக்கு 211 அழையுங்கள் அல்லது benefits.gov பார்வையிடுங்கள்.",
}

export function FloatingChatbot() {
  const lang = useStore(s => s.language) || 'en'
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const followUpRoundRef = useRef(0)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages, loading])

  // Reset greeting when language changes or chat opens
  useEffect(() => {
    if (open) {
      const greeting = GREETING_MAP[lang] || GREETING_MAP.en
      setMessages([{ role: 'assistant', content: greeting }])
      setFollowUps([])
      followUpRoundRef.current = 0
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, lang])

  const send = async (text = input) => {
    const msg = text.trim()
    if (!msg || loading) return
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setFollowUps([])
    setInput('')
    setLoading(true)
    try {
      const data = await chatWithBot(msg, 'general', 'Rta Benefits Assistant', lang)
      let reply = stripMarkdown(data.reply || data.response || 'Sorry, try again.')
      if (lang !== 'en') {
        reply = await translateText(reply, lang, 'en').catch(() => reply)
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      const pool = FOLLOWUP_MAP[lang] || FOLLOWUP_MAP.en
      const round = followUpRoundRef.current % pool.length
      followUpRoundRef.current += 1
      setFollowUps(pool[round])
    } catch (err) {
      const isOffline = !import.meta.env.VITE_API_ENDPOINT || err?.message?.includes('No API endpoint') || err?.reason === 'network'
      const errMsg = isOffline
        ? (OFFLINE_MSG[lang] || OFFLINE_MSG.en)
        : 'Sorry, I had trouble reaching the server. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
    } finally {
      setLoading(false)
    }
  }

  const startRecognition = (langCode) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = langCode
    rec.continuous = false     // Safari compatible
    rec.interimResults = false // Only final results
    rec.maxAlternatives = 1
    recognitionRef.current = rec
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      send(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = (e) => {
      if (e.error === 'language-not-supported' && langCode !== 'en-US') {
        startRecognition('en-US')
      } else {
        setListening(false)
      }
    }
    try { rec.start(); setListening(true) } catch { setListening(false) }
  }

  const toggleListen = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    startRecognition(langToBCP47(lang))
  }

  const starters = STARTERS_MAP[lang] || STARTERS_MAP.en
  const hasUserMessage = messages.some(m => m.role === 'user')

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-scale-in"
          style={{ width: 'min(360px, calc(100vw - 2rem))', height: 'min(520px, calc(100vh - 6rem))' }}
        >
          {/* Header */}
          <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm"
                style={{ background: 'linear-gradient(135deg,#fbbf24,#fb923c,#fb7185)', fontFamily: 'system-ui,sans-serif' }}
              >ऋ</span>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Rta Assistant</p>
                <p className="text-emerald-200 text-xs">{lang.toUpperCase()} · Benefits help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[240px] px-3 py-2 rounded-xl text-sm leading-relaxed font-medium ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl rounded-bl-sm shadow-sm flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick starters or follow-up chips */}
          {(!hasUserMessage || followUps.length > 0) && !loading && (
            <div className="px-3 pb-2 bg-gray-50 flex gap-1.5 flex-wrap flex-shrink-0">
              {(hasUserMessage ? followUps : starters).map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 px-2.5 py-1 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input + mic */}
          <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <button
                onClick={toggleListen}
                title={listening ? 'Stop' : `Speak in ${lang.toUpperCase()}`}
                className={`px-2.5 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                  listening
                    ? 'border-red-400 bg-red-50 text-red-600 animate-pulse'
                    : 'border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                <svg className="w-4 h-4" fill={listening ? 'currentColor' : 'none'} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 2a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 14.93A6 6 0 0013 14.93M10 17v2M8 19h4" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={listening ? `Listening (${lang.toUpperCase()})…` : 'Ask about benefits…'}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 text-white px-3 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: '#059669' }}
        aria-label="Open benefits assistant"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          </svg>
        )}
      </button>
    </div>
  )
}

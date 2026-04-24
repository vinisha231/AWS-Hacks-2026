import { useMemo } from 'react'

const QUOTES = [
  "Every craving you outlast makes the next one shorter.",
  "You are not your urges. You are what you do after them.",
  "The discomfort you feel right now is proof you're changing.",
  "A craving is just a wave. You don't have to swim in it.",
  "Recovery isn't linear. Every day you try counts.",
  "You've survived 100% of your worst moments so far.",
  "Strength isn't the absence of struggle. It's continuing anyway.",
  "One moment. One breath. One choice. That's all it takes.",
  "Your brain is literally rewiring itself right now.",
  "The hardest part of any craving is the first minute.",
  "You're not fighting addiction. You're building a new self.",
  "The version of you that quits hasn't met today's version yet.",
]

export default function DailyAffirmation() {
  const quote = useMemo(() => QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length], [])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-900/20 bg-gradient-to-r from-amber-950/50 to-stone-900 px-6 py-5 flex items-center gap-4">
      <div className="text-2xl shrink-0">💬</div>
      <div>
        <p className="text-stone-400 text-xs uppercase tracking-widest mb-1">Today's truth</p>
        <p className="text-stone-200 text-sm leading-relaxed italic">"{quote}"</p>
      </div>
    </div>
  )
}

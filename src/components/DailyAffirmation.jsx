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
    <div className="flex items-start gap-3 py-2">
      <span className="text-xl shrink-0 mt-0.5 opacity-70">💬</span>
      <div>
        <p className="text-stone-400 text-xs uppercase tracking-widest font-medium mb-1.5">Today's truth</p>
        <p className="text-stone-800 text-base leading-relaxed italic">"{quote}"</p>
      </div>
    </div>
  )
}

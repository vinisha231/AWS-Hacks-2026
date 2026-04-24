import { useMemo } from 'react'

const AFFIRMATIONS = [
  "Every craving you outlast makes the next one shorter.",
  "You are not your urges. You are what you do after them.",
  "The discomfort you feel right now is proof you're changing.",
  "A craving is just a wave. You don't have to swim in it.",
  "Recovery isn't linear. Every day you try counts.",
  "The version of you that quits hasn't met today's version yet.",
  "You've survived 100% of your worst moments so far.",
  "Strength isn't the absence of struggle. It's continuing anyway.",
  "One moment. One breath. One choice. That's all it takes.",
  "Your brain is literally rewiring itself right now. Keep going.",
  "The hardest part of any craving is the first minute. Get past it.",
  "You're not fighting addiction. You're building a new self.",
]

export default function DailyAffirmation() {
  const quote = useMemo(() => {
    const dayOfYear = Math.floor(Date.now() / 86400000)
    return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length]
  }, [])

  return (
    <div className="bg-gradient-to-br from-amber-950/40 to-stone-900 rounded-2xl p-5 border border-amber-900/30">
      <p className="text-amber-500 text-xs uppercase tracking-widest mb-2">Today's truth</p>
      <p className="text-stone-200 text-sm leading-relaxed italic">"{quote}"</p>
    </div>
  )
}

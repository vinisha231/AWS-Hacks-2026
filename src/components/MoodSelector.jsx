const MOODS = [
  {
    emoji: '😤',
    label: 'Restless / Bored',
    sub: 'Can\'t sit still, need something new',
    hormone: 'dopamine',
    color: 'border-orange-500 bg-orange-500/10 text-orange-300',
  },
  {
    emoji: '😔',
    label: 'Low / Hopeless',
    sub: 'Flat, grey, can\'t feel much',
    hormone: 'serotonin',
    color: 'border-blue-500 bg-blue-500/10 text-blue-300',
  },
  {
    emoji: '🥺',
    label: 'Lonely / Disconnected',
    sub: 'Craving closeness, feeling invisible',
    hormone: 'oxytocin',
    color: 'border-pink-500 bg-pink-500/10 text-pink-300',
  },
  {
    emoji: '😰',
    label: 'Tense / Anxious',
    sub: 'Body wound tight, can\'t relax',
    hormone: 'endorphins',
    color: 'border-purple-500 bg-purple-500/10 text-purple-300',
  },
]

export default function MoodSelector({ onSelect, onSkip }) {
  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-stone-400 text-sm uppercase tracking-widest mb-2">Right now, I feel…</p>
          <h2 className="text-white text-2xl font-bold">What's driving this?</h2>
        </div>

        <div className="flex flex-col gap-3">
          {MOODS.map(({ emoji, label, sub, hormone, color }) => (
            <button
              key={hormone}
              onClick={() => onSelect(hormone)}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-95 text-left ${color}`}
            >
              <span className="text-3xl">{emoji}</span>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm opacity-70">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onSkip}
          className="w-full mt-6 text-stone-500 text-sm hover:text-stone-300 transition-colors"
        >
          Not sure — just help me
        </button>
      </div>
    </div>
  )
}

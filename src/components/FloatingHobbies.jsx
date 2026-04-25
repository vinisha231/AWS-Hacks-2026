import { useMemo } from 'react'

const INTEREST_EMOJI = {
  'Drawing': '✏️',      'Music': '🎵',        'Cooking': '🍳',
  'Gardening': '🌱',    'Photography': '📷',  'Writing': '✍️',
  'Puzzles': '🧩',      'Coding': '💻',       'Astronomy': '🔭',
  'Chess': '♟️',        'Languages': '🌍',    'Magic tricks': '🪄',
  'Origami': '🦢',      'Hiking': '🥾',       'Reading': '📚',
  'Poetry': '📜',       'Philosophy': '🧠',   'History': '🏛️',
}

const DEFAULTS = ['🌿', '⭐', '🍃', '✨', '🌸', '🦋']

export default function FloatingHobbies({ interests = [] }) {
  const items = useMemo(() => {
    const emojis = interests.length > 0
      ? interests.map(i => INTEREST_EMOJI[i] || '✨').slice(0, 12)
      : DEFAULTS

    // Spread across the canvas with fixed positions and unique timings
    const positions = [
      { left: '8%',  top: '12%' }, { left: '22%', top: '65%' },
      { left: '38%', top: '20%' }, { left: '55%', top: '78%' },
      { left: '68%', top: '15%' }, { left: '80%', top: '55%' },
      { left: '15%', top: '40%' }, { left: '45%', top: '50%' },
      { left: '72%', top: '35%' }, { left: '90%', top: '75%' },
      { left: '32%', top: '85%' }, { left: '88%', top: '25%' },
    ]

    return emojis.map((emoji, i) => ({
      emoji,
      style: {
        left: positions[i % positions.length].left,
        top:  positions[i % positions.length].top,
        animationDuration: `${7 + (i * 1.3) % 6}s`,
        animationDelay: `${(i * 0.9) % 4}s`,
        fontSize: `${20 + (i % 3) * 8}px`,
      }
    }))
  }, [interests])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
      {items.map(({ emoji, style }, i) => (
        <span
          key={i}
          className={i % 2 === 0 ? 'float-hobby' : 'float-hobby-alt'}
          style={{ position: 'absolute', ...style }}>
          {emoji}
        </span>
      ))}
    </div>
  )
}

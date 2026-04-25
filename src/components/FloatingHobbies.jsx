import { useMemo } from 'react'

const HOBBY_ELEMENTS = {
  'Chess':        ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛'],
  'Music':        ['♩', '♪', '♫', '♬', '🎸', '🎹', '🎺', '🥁'],
  'Drawing':      ['✏️', '🖍️', '🖌️', '🎨', '✒️', '🖊️'],
  'Gardening':    ['🌱', '🌸', '🌺', '🍀', '🌻', '🌿', '🌾', '🪴'],
  'Photography':  ['📷', '📸', '🔍', '🖼️', '🎞️'],
  'Writing':      ['✍️', '📝', '📖', '🖊️', '📜', '🗒️'],
  'Puzzles':      ['🧩', '🔷', '🔹', '◈', '⬡', '🔵'],
  'Coding':       ['💻', '⌨️', '{ }', '</>', '⚙️', '🖥️'],
  'Astronomy':    ['⭐', '🌙', '🔭', '✨', '🪐', '☄️', '🌟', '💫'],
  'Hiking':       ['🥾', '🏔️', '🌲', '🦅', '🗺️', '⛺', '🧭'],
  'Reading':      ['📚', '📖', '📕', '📗', '📘', '🔖', '📙'],
  'Poetry':       ['📜', '✍️', '🖋️', '💭', '🌙', '🕯️'],
  'Cooking':      ['🍳', '🥄', '🫙', '🔪', '🍽️', '🧂', '🫕'],
  'Origami':      ['🦢', '🦋', '🦉', '🐢', '🦅', '🌸'],
  'Languages':    ['🌍', '🗣️', '✈️', '🗺️', '📖', '🌐'],
  'Magic tricks': ['🪄', '🎩', '🐇', '✨', '⭐', '🌟', '🔮'],
}

const DEFAULTS = ['🌿', '⭐', '🍃', '✨', '🌸', '🦋', '☀️', '🌊']

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export default function FloatingHobbies({ interests = [] }) {
  const items = useMemo(() => {
    const rand = seededRandom(interests.length * 7 + 13)

    // Build pool: for each interest, grab 3-4 elements
    const pool = []
    if (interests.length > 0) {
      interests.forEach(interest => {
        const elems = HOBBY_ELEMENTS[interest] || ['✨']
        // Take up to 4 from each hobby
        const take = Math.min(4, elems.length)
        for (let i = 0; i < take; i++) pool.push(elems[i])
      })
    } else {
      pool.push(...DEFAULTS)
    }

    // Generate 16 floating items spread across the canvas
    return Array.from({ length: 16 }, (_, i) => {
      const elem = pool[i % pool.length]
      const r = rand()
      const r2 = rand()
      const r3 = rand()
      const r4 = rand()
      const isText = !elem.match(/\p{Emoji}/u) // chess pieces etc are text chars
      return {
        elem,
        isText,
        style: {
          left: `${4 + r * 88}%`,
          top: `${5 + r2 * 85}%`,
          animationDuration: `${7 + r3 * 8}s`,
          animationDelay: `${r4 * 5}s`,
          fontSize: isText
            ? `${28 + Math.floor(r * 3) * 10}px`  // chess: 28/38/48px
            : `${28 + Math.floor(r * 4) * 10}px`, // emoji: 28/38/48/58px
          opacity: 0.35,
          fontFamily: isText ? 'serif' : undefined,
          color: isText ? '#78716c' : undefined,
        }
      }
    })
  }, [interests])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
      {items.map(({ elem, style }, i) => (
        <span
          key={i}
          className={i % 2 === 0 ? 'float-hobby' : 'float-hobby-alt'}
          style={{ position: 'absolute', ...style }}>
          {elem}
        </span>
      ))}
    </div>
  )
}

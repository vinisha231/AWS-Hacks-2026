import { useEffect, useRef, useMemo } from 'react'

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

const DEFAULTS = ['🌿', '⭐', '🍃', '✨', '🌸', '🦋', '☀️', '🌊', '🍀', '🌺']

const UNIFORM_SPEED = 0.18

export default function FloatingHobbies({ interests = [] }) {
  const containerRef = useRef(null)

  const particles = useMemo(() => {
    const pool = []
    if (interests.length > 0) {
      interests.forEach(interest => {
        const elems = HOBBY_ELEMENTS[interest] || ['✨']
        elems.slice(0, 5).forEach(e => pool.push(e))
      })
    } else {
      pool.push(...DEFAULTS)
    }

    return Array.from({ length: 20 }, (_, i) => {
      const elem = pool[i % pool.length]
      const isText = !elem.match(/\p{Emoji}/u)
      const sizeStep = Math.floor(Math.random() * 5)
      const size = isText ? 36 + sizeStep * 10 : 44 + sizeStep * 10  // 36-76px text, 44-84px emoji
      const speed = UNIFORM_SPEED
      const angle = Math.random() * Math.PI * 2
      return {
        elem, isText, size, speed,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        x: 0, y: 0,  // set on mount
      }
    })
  }, [interests])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const W = () => window.innerWidth
    const H = () => window.innerHeight

    // Create DOM nodes and set initial positions
    const live = particles.map(p => {
      const el = document.createElement('span')
      el.textContent = p.elem
      el.style.cssText = [
        'position:absolute',
        'left:0', 'top:0',
        `font-size:${p.size}px`,
        'opacity:0.22',
        'pointer-events:none',
        'user-select:none',
        'will-change:transform',
        'line-height:1',
        p.isText ? 'font-family:serif;color:#78716c' : '',
      ].join(';')
      container.appendChild(el)

      return {
        el,
        size: p.size,
        x: Math.random() * Math.max(1, W() - p.size),
        y: Math.random() * Math.max(1, H() - p.size),
        vx: p.vx,
        vy: p.vy,
      }
    })

    let frame
    let tick = 0
    let cachedRects = []

    const refreshRects = () => {
      cachedRects = Array.from(
        document.querySelectorAll('button, a, input, textarea, select, [role="button"]')
      )
        .map(el => el.getBoundingClientRect())
        .filter(r => r.width > 10 && r.height > 10)
    }

    refreshRects()

    const loop = () => {
      tick++
      if (tick % 45 === 0) refreshRects()  // refresh UI element positions every 45 frames

      const w = W(), h = H()

      for (const p of live) {
        p.x += p.vx
        p.y += p.vy

        // Wall bounce
        if (p.x <= 0)          { p.x = 0;          p.vx =  Math.abs(p.vx) }
        if (p.x >= w - p.size) { p.x = w - p.size; p.vx = -Math.abs(p.vx) }
        if (p.y <= 0)          { p.y = 0;           p.vy =  Math.abs(p.vy) }
        if (p.y >= h - p.size) { p.y = h - p.size;  p.vy = -Math.abs(p.vy) }

        // Collision with UI elements
        for (const r of cachedRects) {
          const padding = 4
          const rl = r.left - padding, rr = r.right + padding
          const rt = r.top - padding,  rb = r.bottom + padding

          if (p.x < rr && p.x + p.size > rl && p.y < rb && p.y + p.size > rt) {
            const cx = p.x + p.size / 2, cy = p.y + p.size / 2
            const rcx = (rl + rr) / 2,   rcy = (rt + rb) / 2
            const dx = cx - rcx, dy = cy - rcy

            // Determine which face was hit by comparing overlap ratios
            const overlapX = (p.size / 2 + (rr - rl) / 2) - Math.abs(dx)
            const overlapY = (p.size / 2 + (rb - rt) / 2) - Math.abs(dy)

            if (overlapX < overlapY) {
              p.vx = Math.abs(p.vx) * (dx > 0 ? 1 : -1)
              p.x += p.vx * 3
            } else {
              p.vy = Math.abs(p.vy) * (dy > 0 ? 1 : -1)
              p.y += p.vy * 3
            }
            break  // one collision per frame per particle
          }
        }

        p.el.style.transform = `translate(${Math.round(p.x)}px,${Math.round(p.y)}px)`
      }

      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)

    const onResize = () => { refreshRects() }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      container.innerHTML = ''
    }
  }, [particles])

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}
      aria-hidden="true"
    />
  )
}

import { useEffect, useRef } from 'react'
import { useEmberStore } from '../store/emberStore'

export const AVATAR_OPTIONS = [
  { id: 'cat',     emoji: '🐱', label: 'Cat'     },
  { id: 'dog',     emoji: '🐶', label: 'Dog'     },
  { id: 'fox',     emoji: '🦊', label: 'Fox'     },
  { id: 'frog',    emoji: '🐸', label: 'Frog'    },
  { id: 'penguin', emoji: '🐧', label: 'Penguin' },
  { id: 'robot',   emoji: '🤖', label: 'Robot'   },
  { id: 'none',    emoji: null,  label: 'None'    },
]

const SIZE = 44
const GRAVITY = 0.45
const WALK_SPEED = 0.85
const JUMP_VY = 13

export default function GravityAvatar() {
  const { userAvatar } = useEmberStore()

  useEffect(() => {
    if (!userAvatar || userAvatar === 'none') return
    const option = AVATAR_OPTIONS.find(a => a.id === userAvatar)
    if (!option?.emoji) return

    const el = document.createElement('div')
    el.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      `font-size:${SIZE}px`,
      'line-height:1',
      'z-index:45',
      'pointer-events:none',
      'user-select:none',
      'will-change:transform',
      'display:inline-block',
      // Keep on top of mobile nav (which is z-40)
      'transform:translate(0px,0px)',
    ].join(';')
    el.textContent = option.emoji
    document.body.appendChild(el)

    // Physics state — y = pixels above ground (0 = on ground)
    const s = {
      x: Math.random() * (window.innerWidth - SIZE * 2) + SIZE,
      y: 0,
      vx: Math.random() > 0.5 ? WALK_SPEED : -WALK_SPEED,
      vy: 0,
    }
    let jumpTimer = 0
    let dirTimer = 0
    let raf

    const GROUND_OFFSET = () => {
      // On mobile, there's a bottom nav bar (~64px). On desktop, nothing.
      const isMobile = window.innerWidth < 768
      return isMobile ? 64 : 4
    }

    const tick = () => {
      // Gravity
      s.vy -= GRAVITY
      s.y += s.vy
      s.x += s.vx

      // Ground
      if (s.y <= 0) {
        s.y = 0
        s.vy = 0
      }

      // Walls
      const maxX = window.innerWidth - SIZE
      if (s.x < 0) { s.x = 0; s.vx = Math.abs(s.vx) }
      if (s.x > maxX) { s.x = maxX; s.vx = -Math.abs(s.vx) }

      // Random jump
      jumpTimer++
      if (s.y === 0 && jumpTimer > 100 + Math.random() * 220) {
        s.vy = JUMP_VY
        jumpTimer = 0
      }

      // Random direction change (only on ground)
      dirTimer++
      if (s.y === 0 && dirTimer > 240 + Math.random() * 360) {
        s.vx *= -1
        dirTimer = 0
      }

      // Flip emoji when walking left
      const flipX = s.vx < 0 ? -1 : 1
      const groundOff = GROUND_OFFSET()
      // translate(x, -y) because fixed bottom:0, y=0 is ground
      el.style.transform = `translate(${s.x}px, ${-(s.y + groundOff)}px) scaleX(${flipX})`

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.remove()
    }
  }, [userAvatar])

  return null
}

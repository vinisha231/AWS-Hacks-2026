export default function FlareLogo({ size = 24, className = '' }) {
  // Pivot point where all feathers meet at base
  const px = 40, py = 56

  // Feather template path (base at px,py; tip at px,8 = 48px tall; half-width 7px)
  const feather = `M ${px} ${py} C ${px-7} ${py-14} ${px-8} ${py-32} ${px} 8 C ${px+8} ${py-32} ${px+7} ${py-14} ${px} ${py} Z`

  const FEATHERS = [
    { angle: -8,  color: '#6B2010' },
    { angle: -23, color: '#9B3A18' },
    { angle: -40, color: '#C86018' },
    { angle: -56, color: '#DFA020' },
    { angle: -70, color: '#F5B820' },
    { angle: -80, color: '#FDD040', opacity: 0.88 },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="4 0 62 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {FEATHERS.map(({ angle, color, opacity = 1 }) => (
        <path
          key={angle}
          d={feather}
          fill={color}
          opacity={opacity}
          transform={`rotate(${angle}, ${px}, ${py})`}
        />
      ))}
      {/* Stem / base accent */}
      <ellipse cx={px} cy={py + 2} rx="5" ry="3" fill="#5A1808" opacity="0.6" />
    </svg>
  )
}

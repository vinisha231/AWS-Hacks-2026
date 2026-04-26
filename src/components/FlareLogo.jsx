export default function FlareLogo({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer left leaf */}
      <path d="M10 38 C6 30 8 18 16 12 C13 22 14 30 18 36 Z" fill="#C94B2C" opacity="0.85"/>
      {/* Outer right leaf */}
      <path d="M38 38 C42 30 40 18 32 12 C35 22 34 30 30 36 Z" fill="#C94B2C" opacity="0.85"/>
      {/* Main flame body */}
      <path d="M24 4 C24 4 14 16 14 28 C14 36 18 42 24 44 C30 42 34 36 34 28 C34 16 24 4 24 4 Z" fill="#D4622A"/>
      {/* Inner bright flame */}
      <path d="M24 14 C24 14 18 24 18 31 C18 36 20.5 40 24 41 C27.5 40 30 36 30 31 C30 24 24 14 24 14 Z" fill="#E8883A"/>
      {/* Highlight */}
      <path d="M24 22 C24 22 21 28 21 32 C21 35 22.2 37.5 24 38.5 C25.8 37.5 27 35 27 32 C27 28 24 22 24 22 Z" fill="#F5B85A" opacity="0.9"/>
      {/* Small base leaves */}
      <path d="M17 40 C15 37 14 34 15 31 C17 35 19 38 20 41 Z" fill="#C94B2C" opacity="0.7"/>
      <path d="M31 40 C33 37 34 34 33 31 C31 35 29 38 28 41 Z" fill="#C94B2C" opacity="0.7"/>
    </svg>
  )
}

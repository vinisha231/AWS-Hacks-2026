/**
 * Flare — a four-pointed light burst with a warm inner glow.
 * Used as the app's wordmark icon in the sidebar and nav.
 */
export default function FlareLogo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Flare"
    >
      {/* Outer sparkle rays */}
      <path
        d="M12 1 L13.2 9.5 L21 12 L13.2 14.5 L12 23 L10.8 14.5 L3 12 L10.8 9.5 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Inner bright core */}
      <circle cx="12" cy="12" r="2.2" fill="white" opacity="0.8" />
    </svg>
  )
}

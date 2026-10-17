import type { SocialKind } from '../data/profile'

// Small inline SVG icons, so no icon package is needed. They take the text colour.
export function SocialIcon({ kind }: { kind: SocialKind }) {
  if (kind === 'github') {
    return (
      <svg viewBox="0 0 16 16" width={20} height={20} fill="currentColor" aria-hidden>
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    )
  }
  if (kind === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
        <rect x={2} y={2} width={20} height={20} rx={3} fill="currentColor" />
        <circle cx={7.5} cy={7} r={1.7} fill="white" />
        <rect x={6} y={10} width={3} height={8} fill="white" />
        <path
          d="M11 10h2.8v1.3c.5-.9 1.5-1.5 2.7-1.5 2 0 3.5 1.2 3.5 3.8V18h-3v-4c0-1-.5-1.6-1.4-1.6-.9 0-1.6.6-1.6 1.7V18h-3z"
          fill="white"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

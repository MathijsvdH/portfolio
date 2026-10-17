import type { ReactNode } from 'react'

type Props = {
  open: boolean // false = fading out (it stays mounted a moment so it can animate away)
  onClose: () => void
  children: ReactNode
}

// The card on the right with a close button, used by the project panel and the Home panel.
// Fade/slide animation in index.css.
export function Panel({ open, onClose, children }: Props) {
  return (
    <aside
      className={open ? 'project-panel open' : 'project-panel'}
      inert={!open}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 'min(360px, calc(100% - 32px))',
        maxHeight: 'calc(100% - 100px)',
        overflowY: 'auto',
        padding: 20,
        background: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="round-button"
        style={{
          float: 'right',
          width: 32,
          height: 32,
          marginLeft: 12,
          border: 'none',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.06)',
          color: 'inherit',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
      {children}
    </aside>
  )
}

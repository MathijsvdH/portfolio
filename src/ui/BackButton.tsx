// Shown while a zone is open: flies the camera back to the whole-island view.
// Always mounted so it can slide in and out (animation in index.css).
export function BackButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={open ? 'back-button open' : 'back-button'}
      inert={!open}
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        padding: '10px 20px',
        border: 'none',
        borderRadius: 999,
        background: 'rgba(255, 255, 255, 0.92)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        font: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      ← Back to island
    </button>
  )
}

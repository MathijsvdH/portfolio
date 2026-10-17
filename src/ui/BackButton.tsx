// Shown while a zone is open: flies the camera back to the whole-island view.
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
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

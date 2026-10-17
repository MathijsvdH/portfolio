// The button at the bottom of the screen. Its text and where it goes depend on where the
// camera is (App.tsx): "Explore the island" from the beach, "Back to island" from a zone,
// "Back to the beach" from the overview. Slides in on page load (animation in index.css).
export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="back-button open"
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
      {label}
    </button>
  )
}

import type { RefObject } from 'react'
import type { HomeSpot, Vec3 } from '../scene/layout'

export type HomeLabel = { spot: HomeSpot; text: string; at: Vec3 }

type Props = {
  labels: HomeLabel[]
  show: boolean // only at the start view on the beach
  refs: RefObject<(HTMLElement | null)[]> // ScreenAnchors (in the canvas) moves them
  onSelect: (spot: HomeSpot) => void
}

// Name tags over the clickable things at Home, telling visitors what to click. They're
// buttons too, so they also work on phones (no hover) and with the keyboard.
export function HomeLabels({ labels, show, refs, onSelect }: Props) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {labels.map((label, i) => (
        <button
          key={label.spot}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={show ? 'home-label show' : 'home-label'}
          inert={!show}
          onClick={() => onSelect(label.spot)}
        >
          {label.text}
        </button>
      ))}
    </div>
  )
}

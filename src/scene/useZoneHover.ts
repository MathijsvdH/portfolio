import { useState } from 'react'
import { useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'

// Hover and click for a zone's invisible hitboxes. Spread `handlers` on every hitbox mesh:
// <mesh {...handlers} visible={false}>.
//
// Why on each hitbox and not on the zone's group: R3F keeps one hover record per object
// that has the handlers. With them on the group, moving the pointer straight from one
// child to another can give an "out" without a new "over", so the hover flickers. On the
// hitboxes, every move between them gives a clean out + over pair, and we keep track of
// which hitboxes the pointer is on. Bonus: only the hitboxes are tested against the
// pointer, not every small part of the zone, which is faster.
export function useZoneHover(onClick: () => void) {
  const [under, setUnder] = useState<ReadonlySet<string>>(new Set()) // hitboxes under the pointer
  const hovered = under.size > 0
  useCursor(hovered) // pointer cursor while hovering

  const handlers = {
    onClick(e: ThreeEvent<MouseEvent>) {
      if (e.delta > 5) return // the mouse moved: that was a drag to rotate, not a click
      e.stopPropagation()
      onClick()
    },
    onPointerOver(e: ThreeEvent<PointerEvent>) {
      e.stopPropagation() // zones behind this one don't light up too
      const id = e.object.uuid
      setUnder((s) => new Set(s).add(id))
    },
    onPointerOut(e: ThreeEvent<PointerEvent>) {
      const id = e.object.uuid
      setUnder((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    },
  }

  return { hovered, handlers }
}

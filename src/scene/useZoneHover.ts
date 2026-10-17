import { useState } from 'react'
import * as THREE from 'three'
import { useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { heightAt } from './islandShape'

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

  function setOver(id: string, over: boolean) {
    // Returning the same set when nothing changed means React doesn't redraw.
    setUnder((s) => {
      if (s.has(id) === over) return s
      const next = new Set(s)
      if (over) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // Runs on every pointer move over a hitbox: it's only "hovered" while no hill or
  // mountain is in the way.
  function track(e: ThreeEvent<PointerEvent>) {
    const visible = !behindGround(e)
    if (visible) e.stopPropagation() // zones behind this one don't light up too
    setOver(e.object.uuid, visible)
  }

  const handlers = {
    onClick(e: ThreeEvent<MouseEvent>) {
      if (e.delta > 5) return // the mouse moved: that was a drag to rotate, not a click
      if (behindGround(e)) return
      e.stopPropagation()
      onClick()
    },
    onPointerOver: track,
    onPointerMove: track,
    onPointerOut(e: ThreeEvent<PointerEvent>) {
      setOver(e.object.uuid, false)
    },
  }

  return { hovered, handlers }
}

const STEP = 2 // metres between checks along the line of sight
const spot = new THREE.Vector3()

// Is the ground between the camera and the spot where the pointer hit the hitbox?
// R3F only tests the pointer against objects with handlers, so the island itself never
// blocks it: without this, you could hover a zone straight through the mountain. So walk
// along the pointer's ray (the line from the camera through the mouse) and check the
// terrain height at each step. The last few metres are skipped: the hitbox floats just
// above the ground there.
function behindGround(e: ThreeEvent<MouseEvent | PointerEvent>) {
  const length = e.ray.origin.distanceTo(e.point) - 3
  for (let d = STEP; d < length; d += STEP) {
    e.ray.at(d, spot)
    if (heightAt(spot.x, spot.z) > spot.y) return true
  }
  return false
}

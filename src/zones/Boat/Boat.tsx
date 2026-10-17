import { useMemo, useState } from 'react'
import { useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { ProjectId } from '../../data/projects'
import { Bobbing } from '../../scene/Bobbing'
import type { Vec3 } from '../../scene/layout'
import { FishingGear } from './FishingGear'
import { Jetty } from './Jetty'
import { Paint } from './Paint'
import { Sailboat } from './Sailboat'
import { BOAT_DECK, BOAT_POS, BOLLARDS, COLORS, halfWidth, rope, v3 } from './parts'

// Boat zone (knot-tying project): a wooden jetty from the east beach out to sea, a
// sailboat moored alongside, and fishing gear on the beach. Placeholder shapes, life-size.
//
// Zone coordinates: the jetty runs along +x (east, out to sea), +z is south.
// `position` is where the jetty starts on the beach, at sea level (y = 0).
// Sizes and spots are in parts.ts.

// Mooring lines: which bollard (index in BOLLARDS) ties to which spot on the boat (x along it).
const MOORING: [number, number][] = [
  [0, -3.9], // stern line
  [1, 2.0], // spring line, from the front of the boat back to the middle bollard
  [2, 3.9], // bow line
]

// Invisible boxes that catch clicks and hover over the whole zone, so the gaps
// between the parts count too. [centre, size]
const HITBOXES: [Vec3, Vec3][] = [
  [[10.25, 1.25, 2], [21.5, 3.5, 7.4]], // jetty and boat
  [[-2.75, 2.5, -2.75], [6.5, 3.5, 15.5]], // fishing gear on the beach
]

type Props = {
  position: Vec3
  onSelect: (id: ProjectId) => void
}

export function Boat({ position, onSelect }: Props) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered) // pointer cursor while hovering

  // Slight glow on every part while hovered.
  const glow = hovered ? 0.18 : 0

  const mooringLines = useMemo(
    () =>
      MOORING.map(([bollard, x]) => {
        const [bx, by, bz] = BOLLARDS[bollard]
        const cleat = v3(BOAT_POS[0] + x, BOAT_DECK + 0.05, BOAT_POS[2] - (halfWidth(x) - 0.15))
        return rope(v3(bx, by + 0.45, bz), cleat, 0.35)
      }),
    [],
  )

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 5) return // the mouse moved: that was a drag to rotate, not a click
    e.stopPropagation()
    onSelect('knot-tying')
  }

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <Jetty origin={position} glow={glow} />
      {/* The boat floats: it rises, sinks and rocks a little. Kept small, because the
          mooring lines are fixed at both ends. */}
      <Bobbing position={BOAT_POS} height={0.04} roll={0.02} pitch={0.006} period={5}>
        <Sailboat position={[0, 0, 0]} glow={glow} />
      </Bobbing>
      <FishingGear origin={position} glow={glow} />

      {mooringLines.map((g, i) => (
        <mesh key={i} geometry={g}>
          <Paint color={COLORS.rope} glow={glow} />
        </mesh>
      ))}

      {/* visible={false}: not drawn, but the pointer still hits it (raycasting ignores visibility). */}
      {HITBOXES.map(([center, size], i) => (
        <mesh key={i} position={center} visible={false}>
          <boxGeometry args={size} />
        </mesh>
      ))}
    </group>
  )
}

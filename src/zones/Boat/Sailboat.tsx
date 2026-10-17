import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../../scene/layout'
import { Paint } from './Paint'
import { BOAT_DECK, COLORS, extrude, halfWidth, hullShape, rope, ropeThrough, sailGeometry, v3 } from './parts'

// A small sailboat (~9.5 m), bow pointing +x. Boat coordinates: y = 0 is the waterline,
// the deck is at BOAT_DECK, +z is the side away from the jetty.

const MAST_X = 1.0
const MAST_TOP = 13.6
const BOOM_Y = 2.25

// Spots on the deck edge (stanchions) the railing rope runs through.
const STANCHIONS = [-3.7, -2.3, -0.7, 2.2, 3.4]
// Fenders hang along the jetty side at these spots.
const FENDERS = [-2.0, 0.2, 2.2]

type Props = { position: Vec3; glow: number }

export function Sailboat({ position, glow }: Props) {
  const geo = useMemo(() => {
    const shape = hullShape()
    const V2 = THREE.Vector2
    return {
      hullLow: extrude(shape, 0.5, 0.25),
      hullHigh: extrude(shape, 0.55, 0.25),
      deck: extrude(shape, 0.06, 0),
      mainsail: sailGeometry(new V2(MAST_X + 0.08, BOOM_Y + 0.1), new V2(MAST_X + 0.08, MAST_TOP - 0.3), new V2(-3.5, BOOM_Y + 0.1), 0.4),
      jib: sailGeometry(new V2(4.65, 1.3), new V2(1.15, 12.1), new V2(1.55, 1.75), 0.3),
    }
  }, [])

  // All the rigging and other ropes on board.
  const ropes = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const top = v3(MAST_X, MAST_TOP - 0.05, 0)
    list.push(rope(v3(4.75, 1.1, 0), v3(MAST_X, 12.5, 0), 0, 0.02)) // forestay: bow to mast
    list.push(rope(top, v3(-4.1, 1.05, 0), 0, 0.02)) // backstay: mast top to stern
    for (const side of [-1, 1]) {
      const chainplate = v3(0.8, BOAT_DECK, side * (halfWidth(0.8) - 0.1))
      // Shrouds hold the mast up sideways, over the spreader tips.
      list.push(ropeThrough([v3(MAST_X, 12, 0), v3(MAST_X, 7.5, side * 1.3), chainplate], 0.02))
      list.push(rope(v3(MAST_X, 7.3, 0), chainplate, 0, 0.02))
      // Railing: a rope through the tops of the stanchions, from the stern to the bow.
      const tops = STANCHIONS.map((x) => v3(x, BOAT_DECK + 0.6, side * (halfWidth(x) - 0.1)))
      list.push(ropeThrough([...tops, v3(4.3, BOAT_DECK + 0.6, 0)]))
    }
    list.push(rope(v3(-3.5, BOOM_Y - 0.05, 0), v3(-3.5, BOAT_DECK, 0))) // main sheet: boom to deck
    list.push(rope(v3(1.55, 1.75, 0.05), v3(-0.3, BOAT_DECK + 0.05, halfWidth(-0.3) - 0.15), 0.12)) // jib sheet
    // Fenders hang on ropes from the railing on the jetty side.
    for (const x of FENDERS) {
      const z = -(halfWidth(x) - 0.1)
      list.push(rope(v3(x, BOAT_DECK + 0.6, z), v3(x, 0.85, -(halfWidth(x) + 0.41))))
    }
    return list
  }, [])

  return (
    <group position={position}>
      {/* Hull: a dark lower half (mostly under water) and a white upper half. */}
      <mesh geometry={geo.hullLow} position={[0, -0.5, 0]} castShadow>
        <Paint color={COLORS.hullLow} glow={glow} />
      </mesh>
      <mesh geometry={geo.hullHigh} position={[0, 0.2, 0]} castShadow receiveShadow>
        <Paint color={COLORS.hull} glow={glow} />
      </mesh>
      <mesh geometry={geo.deck} position={[0, BOAT_DECK - 0.06, 0]} receiveShadow>
        <Paint color={COLORS.deck} glow={glow} />
      </mesh>

      {/* Low cabin roof behind the mast, with a window on each side. */}
      <mesh position={[-1.1, BOAT_DECK + 0.28, 0]} castShadow>
        <boxGeometry args={[2.8, 0.55, 1.9]} />
        <Paint color={COLORS.hull} glow={glow} />
      </mesh>
      <mesh position={[-1.1, BOAT_DECK + 0.59, 0]} castShadow>
        <boxGeometry args={[3.0, 0.08, 2.1]} />
        <Paint color={COLORS.roof} glow={glow} />
      </mesh>
      {[-0.96, 0.96].map((z) => (
        <mesh key={z} position={[-1.1, BOAT_DECK + 0.3, z]}>
          <boxGeometry args={[1.8, 0.22, 0.02]} />
          <Paint color={COLORS.window} glow={glow} />
        </mesh>
      ))}

      {/* Mast, spreaders (the cross bar) and boom (the bar along the bottom of the mainsail). */}
      <mesh position={[MAST_X, (BOAT_DECK + MAST_TOP) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, MAST_TOP - BOAT_DECK, 10]} />
        <Paint color={COLORS.mast} glow={glow} />
      </mesh>
      <mesh position={[MAST_X, 7.5, 0]}>
        <boxGeometry args={[0.06, 0.06, 2.6]} />
        <Paint color={COLORS.mast} glow={glow} />
      </mesh>
      <mesh position={[(MAST_X - 3.6) / 2, BOOM_Y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, MAST_X + 3.6, 8]} />
        <Paint color={COLORS.mast} glow={glow} />
      </mesh>

      {/* Sails, visible from both sides. */}
      <mesh geometry={geo.mainsail} castShadow>
        <Paint color={COLORS.sail} glow={glow} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.jib} castShadow>
        <Paint color={COLORS.sail} glow={glow} side={THREE.DoubleSide} />
      </mesh>

      {/* Stanchions: the short posts holding the railing rope. */}
      {[-1, 1].flatMap((side) =>
        STANCHIONS.map((x) => (
          <mesh key={`${side}${x}`} position={[x, BOAT_DECK + 0.3, side * (halfWidth(x) - 0.1)]}>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
            <Paint color={COLORS.metal} glow={glow} />
          </mesh>
        )),
      )}

      {ropes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <Paint color={COLORS.rope} glow={glow} />
        </mesh>
      ))}

      {/* Fenders: soft bumpers between the boat and the jetty. */}
      {FENDERS.map((x) => (
        <mesh key={x} position={[x, 0.55, -(halfWidth(x) + 0.41)]} castShadow>
          <capsuleGeometry args={[0.15, 0.35, 4, 10]} />
          <Paint color={COLORS.hullLow} glow={glow} />
        </mesh>
      ))}

      {/* Coiled ropes: stacked rings (torus) on the foredeck and at the back. */}
      {[
        [2.7, 0.45],
        [-3.3, 0.6],
      ].flatMap(([x, z]) =>
        [0, 1, 2].map((i) => (
          <mesh key={`${x}${i}`} position={[x, BOAT_DECK + 0.05 + i * 0.07, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.32 - i * 0.06, 0.045, 6, 18]} />
            <Paint color={COLORS.rope} glow={glow} />
          </mesh>
        )),
      )}
    </group>
  )
}

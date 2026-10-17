import { useMemo } from 'react'
import * as THREE from 'three'
import { Bobbing } from '../../scene/Bobbing'
import type { Vec3 } from '../../scene/layout'
import { Paint } from './Paint'
import { COLORS, groundY, stick } from './parts'

// A small dive raft floating at the edge of the reef: a wooden deck on four barrels,
// a ladder into the water, and a red "diver down" flag so you can spot it from afar.
// In raft coordinates: the deck is 3 x 3 m, centred on (0, 0).

const SIZE = 3
const DECK_Y = 0.55 // top of the deck above the water
const POLE_HEIGHT = 4.5
const FLAG: [number, number] = [1.5, 1.05] // width, height

type Props = { origin: Vec3; position: Vec3; glow: number }

export function Raft({ origin, position, glow }: Props) {
  const [px, , pz] = position

  // Anchor line: from under the deck down to the seabed, drifting a little to the side.
  const anchor = useMemo(() => {
    const bottom = groundY(origin, px - 2, pz + 1.5)
    return {
      line: stick(new THREE.Vector3(-1.2, 0, 0.8), new THREE.Vector3(-2, bottom + 0.2, 1.5), 0.025),
      bottom,
    }
  }, [origin, px, pz])

  // Ladder on the east side, from the deck down into the water.
  const ladder = useMemo(() => {
    const rails = [-0.3, 0.3].map((z) => stick(new THREE.Vector3(SIZE / 2 + 0.05, DECK_Y + 0.6, z), new THREE.Vector3(SIZE / 2 + 0.25, -1, z), 0.03))
    const rungs = [0.2, -0.15, -0.5].map((y) => {
      const x = SIZE / 2 + 0.05 + (0.2 * (DECK_Y + 0.6 - y)) / (DECK_Y + 1.6)
      return stick(new THREE.Vector3(x, y, -0.3), new THREE.Vector3(x, y, 0.3), 0.025)
    })
    return [...rails, ...rungs]
  }, [])

  const diagonal = Math.hypot(...FLAG)

  return (
    <group position={position}>
      {/* The raft floats; the anchor block on the seabed stays put. */}
      <Bobbing height={0.05} roll={0.025} pitch={0.02} period={4.3} phase={1}>
        {/* Deck: one slab with dark seams between the planks. */}
        <mesh position={[0, DECK_Y - 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[SIZE, 0.12, SIZE]} />
          <Paint color={COLORS.wood} glow={glow} />
        </mesh>
        {[-1, -0.5, 0, 0.5, 1].map((x) => (
          <mesh key={x} position={[x * 1.2, DECK_Y + 0.001, 0]}>
            <boxGeometry args={[0.04, 0.002, SIZE]} />
            <Paint color={COLORS.woodDark} glow={glow} />
          </mesh>
        ))}

        {/* Barrels lying under the deck, half in the water. */}
        {[
          [-0.8, -0.9],
          [0.8, -0.9],
          [-0.8, 0.9],
          [0.8, 0.9],
        ].map(([x, z]) => (
          <mesh key={`${x},${z}`} position={[x, 0.12, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 1.3, 12]} />
            <Paint color={COLORS.barrel} glow={glow} />
          </mesh>
        ))}

        {ladder.map((g, i) => (
          <mesh key={i} geometry={g}>
            <Paint color={COLORS.metal} glow={glow} />
          </mesh>
        ))}

        {/* Anchor line, down to the block on the seabed. */}
        <mesh geometry={anchor.line}>
          <Paint color={COLORS.white} glow={glow} />
        </mesh>

        {/* Flag pole in the north-west corner with the red "diver down" flag:
            a white stripe from the top by the pole to the far bottom corner. */}
        <mesh position={[-SIZE / 2 + 0.15, DECK_Y + POLE_HEIGHT / 2, -SIZE / 2 + 0.15]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, POLE_HEIGHT, 8]} />
          <Paint color={COLORS.white} glow={glow} />
        </mesh>
        <group position={[-SIZE / 2 + 0.15 + FLAG[0] / 2 + 0.05, DECK_Y + POLE_HEIGHT - FLAG[1] / 2 - 0.1, -SIZE / 2 + 0.15]}>
          <mesh castShadow>
            <boxGeometry args={[FLAG[0], FLAG[1], 0.02]} />
            <Paint color={COLORS.flag} glow={glow} />
          </mesh>
          <mesh rotation={[0, 0, -Math.atan2(FLAG[1], FLAG[0])]}>
            <boxGeometry args={[diagonal - 0.2, 0.22, 0.03]} />
            <Paint color={COLORS.white} glow={glow} />
          </mesh>
        </group>

        {/* A dive tank lying on the deck. */}
        <mesh position={[0.4, DECK_Y + 0.13, 0.7]} rotation={[0, 0.4, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.13, 0.5, 4, 10]} />
          <Paint color={COLORS.tank} glow={glow} />
        </mesh>
      </Bobbing>
      <mesh position={[-2, anchor.bottom + 0.15, 1.5]}>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <Paint color={COLORS.rock} glow={glow} />
      </mesh>
    </group>
  )
}

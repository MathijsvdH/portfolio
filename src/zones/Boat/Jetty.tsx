import { useMemo } from 'react'
import type { Vec3 } from '../../scene/layout'
import { Paint } from './Paint'
import { BOLLARDS, COLORS, DECK_HEIGHT, JETTY_LENGTH, JETTY_WIDTH, groundY } from './parts'

const POST_SPACING = 2.5

// The wooden jetty, in zone coordinates. `origin` is the zone's position, needed to
// find the ground under each post.
export function Jetty({ origin, glow }: { origin: Vec3; glow: number }) {
  // Posts on both sides, each reaching down into the sand or seabed.
  const posts = useMemo(() => {
    const list: { x: number; z: number; length: number }[] = []
    for (let x = 0.3; x <= JETTY_LENGTH; x += POST_SPACING) {
      for (const z of [-JETTY_WIDTH / 2 + 0.15, JETTY_WIDTH / 2 - 0.15]) {
        const bottom = groundY(origin, x, z) - 0.8 // a bit into the ground
        const top = DECK_HEIGHT + 0.3 // sticks out just above the planks
        list.push({ x, z, length: top - bottom })
      }
    }
    return list
  }, [origin])

  return (
    <group>
      {/* One slab of planks, with dark seams drawn as thin strips across it. */}
      <mesh position={[JETTY_LENGTH / 2, DECK_HEIGHT - 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[JETTY_LENGTH, 0.2, JETTY_WIDTH]} />
        <Paint color={COLORS.wood} glow={glow} />
      </mesh>
      {Array.from({ length: Math.floor(JETTY_LENGTH / 0.6) }, (_, i) => (
        <mesh key={i} position={[0.3 + i * 0.6, DECK_HEIGHT + 0.001, 0]}>
          <boxGeometry args={[0.04, 0.002, JETTY_WIDTH]} />
          <Paint color={COLORS.woodDark} glow={glow} />
        </mesh>
      ))}
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, DECK_HEIGHT + 0.3 - p.length / 2, p.z]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, p.length, 8]} />
          <Paint color={COLORS.woodDark} glow={glow} />
        </mesh>
      ))}

      {/* Bollards: short posts the mooring lines are tied to. */}
      {BOLLARDS.map(([x, y, z]) => (
        <mesh key={x} position={[x, y + 0.25, z]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.5, 10]} />
          <Paint color={COLORS.metal} glow={glow} />
        </mesh>
      ))}
    </group>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Seagulls circling over the coast, in a few small flocks. Each gull flies round a circle,
// leaning into the turn, flaps its wings for a moment, then glides.
// Real size: about 1.4 m from wing tip to wing tip.

type Flock = { centre: [number, number]; height: number; radius: number; count: number; speed: number }

const FLOCKS: Flock[] = [
  { centre: [-32, 84], height: 10, radius: 11, count: 3, speed: 4.5 }, // over Home, low enough for the start view
  { centre: [116, -6], height: 17, radius: 12, count: 2, speed: 5.5 }, // over the boat
  { centre: [30, 105], height: 26, radius: 34, count: 4, speed: 7 }, // high over the south coast
]

const COLORS = { body: '#ffffff', wing: '#d6dbe0', beak: '#f2b632' }

// The gull's shapes, nose pointing +x. The wings are separate, so they can flap: each one
// turns around the edge where it meets the body.
function gullShapes() {
  const body = new THREE.CapsuleGeometry(0.08, 0.3, 2, 6)
  body.rotateZ(Math.PI / 2)
  const head = new THREE.IcosahedronGeometry(0.075, 0)
  head.translate(0.22, 0.04, 0)
  const tail = new THREE.BoxGeometry(0.14, 0.02, 0.12).toNonIndexed()
  tail.translate(-0.25, 0.01, 0)
  const beak = new THREE.ConeGeometry(0.02, 0.08, 4)
  beak.rotateZ(-Math.PI / 2)
  beak.translate(0.32, 0.03, 0)
  // One wing, sticking out along +z from its hinge at z = 0, tapering towards the tip.
  const wing = new THREE.BoxGeometry(0.2, 0.015, 0.62)
  wing.translate(0, 0, 0.31)
  const pos = wing.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    if (pos.getZ(i) > 0.3) pos.setX(i, pos.getX(i) * 0.5 - 0.04) // narrower and swept back at the tip
  }
  return { body: mergeGeometries([body.toNonIndexed(), head, tail]), beak, wing }
}

export function Birds() {
  const shapes = useMemo(() => gullShapes(), [])
  const gulls = FLOCKS.flatMap((flock, f) => Array.from({ length: flock.count }, (_, i) => ({ flock, seed: f * 10 + i, start: (i / flock.count) * Math.PI * 2 })))
  return gulls.map((g) => <Gull key={g.seed} shapes={shapes} {...g} />)
}

type GullProps = {
  shapes: ReturnType<typeof gullShapes>
  flock: Flock
  seed: number // makes each gull's timing a little different
  start: number // where on the circle it starts (radians)
}

function Gull({ shapes, flock, seed, start }: GullProps) {
  const ref = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const gull = ref.current
    if (!gull || !left.current || !right.current) return
    const t = clock.elapsedTime + seed * 1.7
    const { centre, height, radius, speed } = flock
    // Round the circle (anticlockwise seen from above), the radius breathing a little.
    const r = radius + Math.sin(t * 0.2 + seed) * 3
    const angle = start + (clock.elapsedTime * speed) / radius
    gull.position.set(centre[0] + Math.cos(angle) * r, height + Math.sin(t * 0.4) * 1.5, centre[1] + Math.sin(angle) * r)
    // Face along the circle and lean into the turn ("YXZ": first turn, then lean).
    gull.rotation.set(0.35, Math.atan2(-Math.cos(angle), -Math.sin(angle)), 0, 'YXZ')

    // Flap for 1.5 s out of every 5 s, glide with the wings slightly up the rest of the time.
    const flapping = (t % 5) < 1.5
    const wing = flapping ? 0.15 + Math.sin(t * 9) * 0.55 : 0.12
    left.current.rotation.x = -wing
    right.current.rotation.x = wing
  })

  return (
    <group ref={ref}>
      <mesh geometry={shapes.body}>
        <meshStandardMaterial color={COLORS.body} flatShading />
      </mesh>
      <mesh geometry={shapes.beak}>
        <meshStandardMaterial color={COLORS.beak} flatShading />
      </mesh>
      {/* The wings: the right one is the left one mirrored (scale -1 along z). */}
      <group ref={left} position={[0.02, 0.03, 0.05]}>
        <mesh geometry={shapes.wing}>
          <meshStandardMaterial color={COLORS.wing} flatShading />
        </mesh>
      </group>
      <group ref={right} position={[0.02, 0.03, -0.05]} scale={[1, 1, -1]}>
        <mesh geometry={shapes.wing}>
          <meshStandardMaterial color={COLORS.wing} flatShading side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

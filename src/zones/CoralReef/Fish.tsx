import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { REEF_AREA, type Vec3 } from '../../scene/layout'
import { distanceToDepth } from './parts'

// Schools of small tropical fish swimming loops over the reef, under the water.
//
// All fish are one InstancedMesh: one fish shape that the graphics card draws many times
// in one go, each copy ("instance") with its own position, direction, size and colour.
// Every frame, useFrame works out where each fish is and updates its copy's matrix.

const SCHOOLS = 6
const FISH_PER_SCHOOL = 9
const COLORS = ['#ffd93d', '#3a7bff', '#ff8a1e', '#ffffff', '#ffd93d', '#3a7bff']
const DEPTH = -0.45 // metres below the surface, where the water is at least 1.2 m deep
const SPEED = 0.7 // metres per second along the loop

type School = { x: number; z: number; rx: number; rz: number; direction: 1 | -1; color: string }
type Fish = { school: School; lag: number; side: number; up: number; size: number; wiggle: number }

// Where the schools swim: spread along the reef, in the water 1.2-2.2 m deep. Zone coordinates.
function schools(origin: Vec3): School[] {
  const list: School[] = []
  for (let i = 0; i < SCHOOLS; i++) {
    const t = (i + 0.5) / SCHOOLS
    const a = THREE.MathUtils.degToRad(REEF_AREA.from + 6 + (REEF_AREA.to - REEF_AREA.from - 12) * t)
    const r = (distanceToDepth(a, 1.2) + distanceToDepth(a, 2.2)) / 2
    list.push({
      x: Math.cos(a) * r - origin[0],
      z: Math.sin(a) * r - origin[2],
      rx: 2.5 + (i % 3) * 0.6,
      rz: 1.8 + ((i + 1) % 3) * 0.5,
      direction: i % 2 ? 1 : -1,
      color: COLORS[i % COLORS.length]!,
    })
  }
  return list
}

// One fish, 1 m long (each copy is scaled to its real size), nose pointing +x: a flattened
// diamond body and a triangle tail.
function fishGeometry() {
  const body = new THREE.IcosahedronGeometry(0.5, 0)
  body.scale(1, 0.55, 0.25)
  const tail = new THREE.ConeGeometry(0.28, 0.4, 3).toNonIndexed()
  tail.rotateZ(Math.PI / 2) // point the tip at the body
  tail.scale(1, 1, 0.3)
  tail.translate(-0.62, 0, 0)
  return mergeGeometries([body, tail])
}

export function Fish({ origin }: { origin: Vec3 }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => fishGeometry(), [])

  // Every fish: its school, how far behind the leader it swims (radians along the loop),
  // how far to the side and up, its length and when its tail wiggles.
  const fish = useMemo(() => {
    const list: Fish[] = []
    for (const [s, school] of schools(origin).entries()) {
      for (let i = 0; i < FISH_PER_SCHOOL; i++) {
        const k = s * FISH_PER_SCHOOL + i
        list.push({
          school,
          lag: i * 0.14,
          side: Math.sin(k * 2.3) * 0.6,
          up: Math.sin(k * 1.7) * 0.18,
          size: 0.32 + ((k * 7) % 5) * 0.03, // a bit bigger than real, to be seen from above
          wiggle: k * 1.3,
        })
      }
    }
    return list
  }, [origin])

  // Colours are set once: setColorAt gives each copy its own colour.
  useLayoutEffect(() => {
    const mesh = ref.current!
    const color = new THREE.Color()
    fish.forEach((f, i) => mesh.setColorAt(i, color.set(f.school.color)))
    mesh.instanceColor!.needsUpdate = true
  }, [fish])

  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const position = useMemo(() => new THREE.Vector3(), [])
  const turn = useMemo(() => new THREE.Quaternion(), [])
  const scale = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.elapsedTime
    fish.forEach((f, i) => {
      const { x, z, rx, rz, direction } = f.school
      // Round an oval: the angle grows with time (faster on a smaller loop).
      const angle = direction * ((t * SPEED) / ((rx + rz) / 2) - f.lag) + f.wiggle * 0.02
      const rxs = rx + f.side
      const rzs = rz + f.side
      position.set(x + Math.cos(angle) * rxs, DEPTH + f.up + Math.sin(t * 0.8 + f.wiggle) * 0.05, z + Math.sin(angle) * rzs)
      // Face along the loop: the direction it's moving in, plus a quick tail wiggle.
      const dx = -Math.sin(angle) * rxs * direction
      const dz = Math.cos(angle) * rzs * direction
      turn.setFromAxisAngle(up, Math.atan2(-dz, dx) + Math.sin(t * 11 + f.wiggle) * 0.12)
      matrix.compose(position, turn, scale.setScalar(f.size))
      mesh.setMatrixAt(i, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  // frustumCulled={false}: always draw the fish. They move, so the sphere three.js would
  // check against the view can't be worked out once. A little white glow (emissive) keeps
  // them bright under the water, like the corals.
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, fish.length]} frustumCulled={false}>
      <meshStandardMaterial flatShading roughness={0.5} emissive="#ffffff" emissiveIntensity={0.15} />
    </instancedMesh>
  )
}

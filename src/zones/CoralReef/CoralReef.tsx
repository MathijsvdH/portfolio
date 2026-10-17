import { useMemo } from 'react'
import * as THREE from 'three'
import type { ProjectId } from '../../data/projects'
import { heightAt } from '../../scene/islandShape'
import { REEF_AREA, type Vec3 } from '../../scene/layout'
import { useZoneHover } from '../../scene/useZoneHover'
import { Paint } from './Paint'
import { Raft } from './Raft'
import {
  COLORS,
  Pieces,
  brainCoral,
  branchingCoral,
  fanLattice,
  groundY,
  place,
  random,
  rock,
  seaFan,
  seaGrass,
  starfish,
  tableCoral,
  tubeSponges,
} from './parts'

// Coral reef zone: patches of coral in a strip along the coast where the water is
// 1-2.5 m deep, seen through the clear water, with a dive raft at the edge.
// Placeholder shapes, life-size.
//
// Zone coordinates: `position` is the middle of the reef at sea level (y = 0),
// +x is east, +z is south. Shapes and colours are in parts.ts.

const SEED = 8 // change it for a different (but always the same) random reef

// Number of reef patches along the coast, with sandy channels between them.
const PATCH_COUNT = 9

// Coral types, how often each appears, and the colours it comes in.
const TYPES = [
  { kind: 'brain', weight: 0.24, colors: [COLORS.yellow, COLORS.lilac, COLORS.teal, COLORS.pink] },
  { kind: 'branching', weight: 0.24, colors: [COLORS.pink, COLORS.red, COLORS.purple, COLORS.orange] },
  { kind: 'table', weight: 0.12, colors: [COLORS.orange, COLORS.teal, COLORS.yellow] },
  { kind: 'tubes', weight: 0.13, colors: [COLORS.purple, COLORS.orange, COLORS.red] },
  { kind: 'fan', weight: 0.12, colors: [COLORS.purple, COLORS.pink, COLORS.red] },
  { kind: 'grass', weight: 0.15, colors: [COLORS.seagrass] },
] as const

// Rocks: [x, z, size]. The big ones by the shore stick out of the water.
const ROCKS: [number, number, number][] = [
  [-13, -9, 1.9],
  [-11.5, -11, 1.2],
  [-15, 1, 1.5],
  [2, -9, 0.8],
  [11, 3, 0.9],
  [-6, 11, 0.7],
]

const RAFT_POS: Vec3 = [5, 0, 5]

// Invisible hitboxes: a flat strip over the whole reef, floating just above the tallest
// rock, and a box around the raft and its flag. [centre, size]
const HIT_HEIGHT = 1.5
const RAFT_HITBOX: [Vec3, Vec3] = [[RAFT_POS[0], 2.7, RAFT_POS[2]], [4.4, 5.4, 4.4]]

type Props = {
  position: Vec3
  onSelect: (id: ProjectId) => void
}

export function CoralReef({ position, onSelect }: Props) {
  const { hovered, handlers } = useZoneHover(() => onSelect('coral-reef'))

  // Slight glow on every part while hovered.
  const glow = hovered ? 0.18 : 0

  const meshes = useMemo(() => buildReef(position), [position])
  const hitbox = useMemo(() => hitStrip(position), [position])
  const lattice = fanLattice()

  return (
    <group position={position}>
      {meshes.map(({ key, kind, color, geometry }) => (
        <mesh key={key} geometry={geometry} castShadow receiveShadow>
          {/* The coral lights itself up a little in its own colour (emissive), so it stays bright under water. */}
          {kind === 'fan' ? (
            <Paint color={color} emissive={color} glow={0.25 + glow} map={lattice} alphaTest={0.4} side={THREE.DoubleSide} />
          ) : (
            <Paint color={color} emissive={color} glow={0.25 + glow} side={kind === 'double' ? THREE.DoubleSide : THREE.FrontSide} />
          )}
        </mesh>
      ))}

      <Raft origin={position} position={RAFT_POS} glow={glow} />

      {/* The hitboxes catch hover and clicks for the whole zone, also between the corals.
          visible={false}: not drawn, but the pointer still hits it (raycasting ignores
          visibility). DoubleSide so the flat strip is hit from above. */}
      <mesh geometry={hitbox} visible={false} {...handlers}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
      <mesh position={RAFT_HITBOX[0]} visible={false} {...handlers}>
        <boxGeometry args={RAFT_HITBOX[1]} />
      </mesh>
    </group>
  )
}

// How far from the island's centre, in direction `a` (radians), the water first gets
// deeper than `depth` metres.
function distanceToDepth(a: number, depth: number) {
  for (let r = REEF_AREA.inner - 10; r < REEF_AREA.outer + 20; r += 0.5) {
    if (heightAt(Math.cos(a) * r, Math.sin(a) * r) < -depth) return r
  }
  return REEF_AREA.outer + 20
}

// The hitbox: a flat strip along the coast, from just off the beach to a few metres past
// the reef, HIT_HEIGHT above the water.
function hitStrip(origin: Vec3) {
  const steps = 40
  const points: number[] = []
  const index: number[] = []
  for (let i = 0; i <= steps; i++) {
    const a = THREE.MathUtils.degToRad(REEF_AREA.from + ((REEF_AREA.to - REEF_AREA.from) * i) / steps)
    for (const r of [distanceToDepth(a, 0.3), distanceToDepth(a, 2.5) + 5]) {
      points.push(Math.cos(a) * r - origin[0], HIT_HEIGHT, Math.sin(a) * r - origin[2])
    }
    // Two triangles between this pair of points and the previous pair.
    if (i > 0) {
      const k = i * 2
      index.push(k - 2, k - 1, k, k - 1, k + 1, k)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  g.setIndex(index)
  return g
}

// Where the reef patches go: spread along the coast through REEF_AREA, each in the
// band of water between 1 and 2.5 m deep. [x, z, radius] in zone coordinates.
function coastPatches(origin: Vec3, rand: () => number) {
  const patches: [number, number, number][] = []
  const margin = 4 // degrees kept free at both ends, where the clear water fades out
  for (let i = 0; i < PATCH_COUNT; i++) {
    const t = (i + 0.5) / PATCH_COUNT
    const deg = REEF_AREA.from + margin + (REEF_AREA.to - REEF_AREA.from - 2 * margin) * t + (rand() - 0.5) * 2
    const a = THREE.MathUtils.degToRad(deg)
    const shallow = distanceToDepth(a, 1)
    const deep = distanceToDepth(a, 2.5)
    const r = shallow + (deep - shallow) * (0.35 + rand() * 0.3)
    const radius = THREE.MathUtils.clamp((deep - shallow) / 2 + 1, 3.5, 6)
    patches.push([Math.cos(a) * r - origin[0], Math.sin(a) * r - origin[2], radius])
  }
  return patches
}

// Scatters coral over the patches, plus starfish and rocks, and merges it all into
// one mesh per colour. Runs once.
function buildReef(origin: Vec3) {
  const rand = random(SEED)
  const pieces = new Pieces()
  const patches = coastPatches(origin, rand)
  const taken: [number, number, number][] = [] // x, z, radius of every coral so far

  function pickType() {
    let r = rand()
    for (const t of TYPES) {
      r -= t.weight
      if (r <= 0) return t
    }
    return TYPES[0]
  }

  for (const [px, pz, pr] of patches) {
    const wanted = Math.round(pr * pr * 1.4)
    let placed = 0
    for (let tries = 0; placed < wanted && tries < wanted * 10; tries++) {
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * pr // sqrt: spread evenly over the circle, not bunched in the middle
      const x = px + Math.cos(a) * d
      const z = pz + Math.sin(a) * d
      const size = 0.7 + rand() * 1.1 * (1 - (0.5 * d) / pr) // bigger towards the middle of a patch
      if (taken.some(([tx, tz, tr]) => Math.hypot(tx - x, tz - z) < (tr + size) * 0.42)) continue

      // Keep every coral at least 30 cm below the surface.
      const ground = groundY(origin, x, z)
      const room = -ground - 0.3
      if (room < 0.4) continue
      const scale = Math.min(size, room)

      taken.push([x, z, size])
      placed++

      const type = pickType()
      const color = type.colors[Math.floor(rand() * type.colors.length)]
      const tilt = (rand() - 0.5) * 0.25
      const m = place(new THREE.Vector3(x, ground, z), [tilt, rand() * Math.PI * 2, -tilt], scale)
      if (type.kind === 'brain') brainCoral(pieces, color, m)
      else if (type.kind === 'branching') branchingCoral(pieces, color, m, rand)
      else if (type.kind === 'table') tableCoral(pieces, color, m)
      else if (type.kind === 'tubes') tubeSponges(pieces, color, m, rand)
      else if (type.kind === 'fan') seaFan(pieces, color, m)
      else seaGrass(pieces, m, rand)
    }
  }

  // Starfish on the open sand around the patches.
  for (let n = 0, tries = 0; n < 16 && tries < 300; tries++) {
    const [px, pz, pr] = patches[Math.floor(rand() * patches.length)]
    const a = rand() * Math.PI * 2
    const x = px + Math.cos(a) * (pr + rand() * 3)
    const z = pz + Math.sin(a) * (pr + rand() * 3)
    if (taken.some(([tx, tz, tr]) => Math.hypot(tx - x, tz - z) < tr + 0.4)) continue
    starfish(pieces, place(new THREE.Vector3(x, groundY(origin, x, z) + 0.01, z), [0, rand() * Math.PI, 0], 0.8 + rand() * 0.6))
    n++
  }

  for (const [x, z, size] of ROCKS) {
    const ground = groundY(origin, x, z)
    rock(pieces, place(new THREE.Vector3(x, ground + size * 0.3, z), [rand(), rand() * 3, rand()], [size * 1.2, size * 0.9, size]))
  }

  return pieces.build()
}

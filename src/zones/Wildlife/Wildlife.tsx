import { useMemo } from 'react'
import * as THREE from 'three'
import type { ProjectId } from '../../data/projects'
import type { Vec3 } from '../../scene/layout'
import { useZoneHover } from '../../scene/useZoneHover'
import { deer, fox, hedgehog, rabbit, robin } from './animals'
import { Paint } from './Paint'
import { COLORS, Pieces, fallenLog, flowers, groundY, leafyTree, pine, place, random, rock, trailCamera } from './parts'

// Wildlife zone: a meadow on the northern lowlands, ringed by forest on three sides and
// open to the sea cliffs in the north. Deer, a fox, rabbits, a hedgehog and robins on a
// fallen log, and a trail camera on a tree watching them. Placeholder shapes, life-size.
//
// Zone coordinates: `position` is the middle of the meadow on the ground, +x is east,
// +z is south (towards the mountain). Shapes are in parts.ts and animals.ts.

const SEED = 9 // change it for a different (but always the same) random meadow

// The open meadow: an oval of this size (half-widths in metres) around the middle.
const MEADOW = { x: 24, z: 11 }
const TREE_COUNT = 42

// Animals: [x, z, turn]. Turn is in radians: 0 faces east, PI / 2 faces north.
const STAG: Vec3 = [-4, -3, 0.5]
const DOE: Vec3 = [-0.5, 0.5, 2.7]
const FOX: Vec3 = [9, -4, 2.3]
const RABBITS: Vec3[] = [
  [-12, -6, 1.2],
  [-10.8, -5.4, 2.6],
  [4, -8, -0.4],
]
const LOG: Vec3 = [-15, 2, 0.35] // a fallen tree, 4.5 m long
const HEDGEHOG: Vec3 = [-12.6, 3.6, -0.6]
const ROCKS: [number, number, number][] = [
  [17, -9, 1.2],
  [18.8, -7.6, 0.7],
  [-21, -8, 0.9],
  [7, 9, 0.8],
]

// The tree with the trail camera, at the meadow's edge, and what the camera looks at.
const CAMERA_TREE: [number, number] = [9, 7]
const CAMERA_LOOKS_AT = STAG

// Invisible hitbox: a sheet draped over the meadow and the forest around it, this far
// above the ground. Covers x and z from..to, one point every HIT_STEP metres.
const HIT_AREA = { x: [-44, 40], z: [-16, 26] }
const HIT_STEP = 6
const HIT_HEIGHT = 1.5

type Props = {
  position: Vec3
  onSelect: (id: ProjectId) => void
}

export function Wildlife({ position, onSelect }: Props) {
  const { hovered, handlers } = useZoneHover(() => onSelect('animal-classification'))

  // While hovered, every part lights up a little in its own colour (emissive), so the
  // dark trees get brighter instead of greyer.
  const glow = hovered ? 0.3 : 0

  const meshes = useMemo(() => buildMeadow(position), [position])
  const hitbox = useMemo(() => hitSheet(position), [position])

  return (
    <group position={position}>
      {meshes.map(({ color, geometry }) => (
        <mesh key={color} geometry={geometry} castShadow receiveShadow>
          <Paint color={color} emissive={color} glow={glow} />
        </mesh>
      ))}

      {/* The hitbox catches hover and clicks for the whole zone, also the open grass.
          visible={false}: not drawn, but the pointer still hits it. DoubleSide so it's hit
          from above. */}
      <mesh geometry={hitbox} visible={false} {...handlers}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Is the spot (x, z) inside the meadow oval scaled by `s`?
function inMeadow(x: number, z: number, s = 1) {
  return (x / (MEADOW.x * s)) ** 2 + (z / (MEADOW.z * s)) ** 2 < 1
}

// How steep the ground is at a spot (metres up per metre across).
function slope(origin: Vec3, x: number, z: number) {
  const dx = groundY(origin, x + 1, z) - groundY(origin, x - 1, z)
  const dz = groundY(origin, x, z + 1) - groundY(origin, x, z - 1)
  return Math.hypot(dx, dz) / 2
}

// The hitbox: a grid of points HIT_HEIGHT above the ground, joined into triangles.
function hitSheet(origin: Vec3) {
  const cols = Math.round((HIT_AREA.x[1] - HIT_AREA.x[0]) / HIT_STEP)
  const rows = Math.round((HIT_AREA.z[1] - HIT_AREA.z[0]) / HIT_STEP)
  const points: number[] = []
  const index: number[] = []
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const x = HIT_AREA.x[0] + i * HIT_STEP
      const z = HIT_AREA.z[0] + j * HIT_STEP
      points.push(x, groundY(origin, x, z) + HIT_HEIGHT, z)
      // Two triangles for the square between this point and the ones before it.
      if (i > 0 && j > 0) {
        const k = j * (cols + 1) + i
        index.push(k - cols - 2, k - 1, k - cols - 1, k - cols - 1, k - 1, k)
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  g.setIndex(index)
  return g
}

// Places the trees, flowers, animals and the rest, and merges it all into one mesh per
// colour. Runs once.
function buildMeadow(origin: Vec3) {
  const rand = random(SEED)
  const pieces = new Pieces()
  const onGround = (x: number, z: number, lift = 0) => new THREE.Vector3(x, groundY(origin, x, z) + lift, z)

  // Forest around the meadow: on the west, south and east sides, not on the cliff side.
  const trees: [number, number][] = [CAMERA_TREE]
  for (let tries = 0; trees.length < TREE_COUNT + 1 && tries < 3000; tries++) {
    const x = -44 + rand() * 84
    const z = -14 + rand() * 40
    if (inMeadow(x, z, 1.15) || !inMeadow(x, z, 2.1)) continue
    if (z < -4) continue // keep the view from the north open
    if (groundY(origin, x, z) < -12 || slope(origin, x, z) > 0.6) continue // not down the cliffs
    if (trees.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 4.5)) continue
    trees.push([x, z])
  }
  for (const [i, [x, z]] of trees.entries()) {
    const m = place(onGround(x, z, -0.2), [0, rand() * Math.PI * 2, 0], 0.8 + rand() * 0.4)
    if (i === 0 || rand() < 0.55) pine(pieces, m, rand)
    else leafyTree(pieces, m, rand)
  }

  // The trail camera on the first tree's trunk, 1 m up, turned towards the stag.
  {
    const [tx, tz] = CAMERA_TREE
    const turn = Math.atan2(-(CAMERA_LOOKS_AT[1] - tz), CAMERA_LOOKS_AT[0] - tx)
    const radius = 0.33
    const dir = new THREE.Vector3(Math.cos(turn), 0, -Math.sin(turn))
    trailCamera(pieces, place(onGround(tx, tz, 1).addScaledVector(dir, radius), [0, turn, 0]), radius)
  }

  // Wild flowers scattered over the meadow.
  const flowerColors = [COLORS.white, COLORS.white, COLORS.yellow, COLORS.purple, COLORS.red]
  for (let n = 0, tries = 0; n < 70 && tries < 500; tries++) {
    const x = (rand() * 2 - 1) * MEADOW.x * 1.05
    const z = (rand() * 2 - 1) * MEADOW.z * 1.05
    if (!inMeadow(x, z, 1.05)) continue
    flowers(pieces, flowerColors[Math.floor(rand() * flowerColors.length)], place(onGround(x, z), [0, rand() * 3, 0]), rand)
    n++
  }

  // The fallen log with two robins on top, and a hedgehog next to it.
  {
    const [x, z, turn] = LOG
    fallenLog(pieces, place(onGround(x, z, -0.05), [0, turn, 0]), 4.5)
    for (const [along, look] of [
      [0.6, 0.4],
      [-1.3, 2.6],
    ]) {
      const bx = x + Math.cos(turn) * along
      const bz = z - Math.sin(turn) * along
      robin(pieces, place(onGround(x, z, 0.69).setX(bx).setZ(bz), [0, turn + look, 0]))
    }
  }
  hedgehog(pieces, place(onGround(HEDGEHOG[0], HEDGEHOG[1]), [0, HEDGEHOG[2], 0]))

  // The animals.
  deer(pieces, place(onGround(STAG[0], STAG[1]), [0, STAG[2], 0]), { antlers: true, grazing: false })
  deer(pieces, place(onGround(DOE[0], DOE[1]), [0, DOE[2], 0], 0.88), { antlers: false, grazing: true })
  fox(pieces, place(onGround(FOX[0], FOX[1]), [0, FOX[2], 0]))
  for (const [x, z, turn] of RABBITS) rabbit(pieces, place(onGround(x, z), [0, turn, 0]))

  for (const [x, z, size] of ROCKS) {
    rock(pieces, place(onGround(x, z, size * 0.2), [rand(), rand() * 3, rand()], [size * 1.2, size * 0.8, size]))
  }

  return pieces.build()
}

import { useMemo } from 'react'
import * as THREE from 'three'
import type { ProjectId } from '../../data/projects'
import type { Vec3 } from '../../scene/layout'
import type { ModelName } from '../../scene/modelList'
import { useModels, type Model } from '../../scene/models'
import { MODEL_COLORS } from '../../scene/palette'
import { useZoneHover } from '../../scene/useZoneHover'
import { MeadowAnimals } from './MeadowAnimals'
import { Paint } from './Paint'
import { Pieces, groundY, model, place, random, trailCamera, trunkRadius } from './parts'
import { LOG, LOG_SIZE, STAG } from './spots'

// Wildlife zone: a meadow on the northern lowlands, ringed by forest on three sides and
// open to the sea cliffs in the north. Deer, a fox, rabbits, a hedgehog and robins on a
// fallen log, and a trail camera on a tree watching them. Life-size. The trees, rocks,
// flowers and the log are models from the kit; the animals and the camera are built here.
//
// Zone coordinates: `position` is the middle of the meadow on the ground, +x is east,
// +z is south (towards the mountain). Shapes are in parts.ts and animals.ts.

const SEED = 9 // change it for a different (but always the same) random meadow

// The open meadow: an oval of this size (half-widths in metres) around the middle.
const MEADOW = { x: 24, z: 11 }
const TREE_COUNT = 60

const ROCKS: [number, number, number][] = [
  [17, -9, 1.2],
  [18.8, -7.6, 0.7],
  [-21, -8, 0.9],
  [7, 9, 0.8],
]

// The tree with the trail camera, at the meadow's edge, and what the camera looks at.
const CAMERA_TREE: [number, number] = [9, 7]
const CAMERA_TREE_MODEL: ModelName = 'tree_default'
const CAMERA_LOOKS_AT = STAG

// Which kit models make the forest, the rocks and the flowers. A name twice is picked twice
// as often.
const PINES: ModelName[] = ['tree_pineRoundA', 'tree_pineTallA_detailed', 'tree_cone', 'tree_pineRoundA']
const LEAFY: ModelName[] = ['tree_default', 'tree_oak', 'tree_fat', 'tree_detailed', 'tree_tall']
const STONES: ModelName[] = ['stone_largeA', 'stone_largeB', 'stone_tallA']
const FLOWERS: ModelName[] = ['flower_redA', 'flower_yellowA', 'flower_purpleA']
const GRASS: ModelName[] = ['grass', 'grass_large']
// The colours of the trees' leaves: those meshes sway in the wind.
const LEAVES = [MODEL_COLORS.leafsGreen, MODEL_COLORS.leafsDark]

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

  // The kit's models. This waits ("suspends") until the model file has loaded.
  const models = useModels()
  const meshes = useMemo(() => buildMeadow(position, models), [position, models])
  const hitbox = useMemo(() => hitSheet(position), [position])

  return (
    <group position={position}>
      {meshes.map(({ color, geometry }) => (
        <mesh key={color} geometry={geometry} castShadow receiveShadow>
          <Paint color={color} emissive={color} glow={glow} sway={LEAVES.includes(color)} />
        </mesh>
      ))}
      <MeadowAnimals origin={position} glow={glow} />

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
function buildMeadow(origin: Vec3, models: Record<ModelName, Model>) {
  const rand = random(SEED)
  const pieces = new Pieces()
  const onGround = (x: number, z: number, lift = 0) => new THREE.Vector3(x, groundY(origin, x, z) + lift, z)
  const one = (list: ModelName[]) => models[list[Math.floor(rand() * list.length)]!]

  // Forest around the meadow: on the west, south and east sides, not on the cliff side.
  const trees: [number, number][] = [CAMERA_TREE]
  for (let tries = 0; trees.length < TREE_COUNT + 1 && tries < 3000; tries++) {
    const x = -44 + rand() * 84
    const z = -14 + rand() * 40
    if (inMeadow(x, z, 1.15) || !inMeadow(x, z, 2.1)) continue
    if (z < -4) continue // keep the view from the north open
    if (groundY(origin, x, z) < -12 || slope(origin, x, z) > 0.6) continue // not down the cliffs
    if (trees.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 3.8)) continue
    trees.push([x, z])
  }
  for (const [i, [x, z]] of trees.entries()) {
    // The camera's tree keeps its normal size, so the strap fits its trunk.
    if (i === 0) {
      model(pieces, models[CAMERA_TREE_MODEL], place(onGround(x, z, -0.2), [0, rand() * Math.PI * 2, 0]))
      continue
    }
    const m = place(onGround(x, z, -0.2), [0, rand() * Math.PI * 2, 0], 1 + rand() * 0.3)
    model(pieces, one(rand() < 0.55 ? PINES : LEAFY), m)
  }

  // The trail camera on the first tree's trunk, 1 m up, turned towards the stag.
  {
    const [tx, tz] = CAMERA_TREE
    const turn = Math.atan2(-(CAMERA_LOOKS_AT[1] - tz), CAMERA_LOOKS_AT[0] - tx)
    const radius = trunkRadius(models[CAMERA_TREE_MODEL], 1.2) // 1.2: the camera is 1 m above the sunk base
    const dir = new THREE.Vector3(Math.cos(turn), 0, -Math.sin(turn))
    trailCamera(pieces, place(onGround(tx, tz, 1).addScaledVector(dir, radius), [0, turn, 0]), radius)
  }

  // Wild flowers scattered over the meadow: small clumps of one colour, with grass tufts.
  for (let n = 0, tries = 0; n < 70 && tries < 500; tries++) {
    const x = (rand() * 2 - 1) * MEADOW.x * 1.05
    const z = (rand() * 2 - 1) * MEADOW.z * 1.05
    if (!inMeadow(x, z, 1.05)) continue
    const flower = one(FLOWERS)
    for (let k = 0; k < 3; k++) {
      const fx = x + (rand() - 0.5) * 0.8
      const fz = z + (rand() - 0.5) * 0.8
      model(pieces, rand() < 0.75 ? flower : one(GRASS), place(onGround(fx, fz, -0.03), [0, rand() * Math.PI * 2, 0], 0.8 + rand() * 0.4))
    }
    n++
  }

  // The fallen log (the robins on it are in MeadowAnimals.tsx). The kit's log is short, so it's
  // stretched along its length (x) to LOG_SIZE.
  {
    const [x, z, turn] = LOG
    const { size } = models.log_large
    const thick = LOG_SIZE.height / size.y
    model(pieces, models.log_large, place(onGround(x, z, -0.05), [0, turn, 0], [LOG_SIZE.length / size.x, thick, thick]))
  }

  // Rocks: scaled so they're `size` * 1.4 m wide (the kit's stones have different shapes:
  // some low and wide, some tall), a little sunk in.
  for (const [x, z, size] of ROCKS) {
    const stone = one(STONES)
    const scale = (size * 1.4) / Math.max(stone.size.x, stone.size.z)
    model(pieces, stone, place(onGround(x, z, -0.15 * size), [0, rand() * Math.PI * 2, 0], scale))
  }

  return pieces.build()
}

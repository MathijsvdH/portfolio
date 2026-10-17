import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import type { ProjectId } from '../../data/projects'
import type { Vec3 } from '../../scene/layout'
import { useZoneHover } from '../../scene/useZoneHover'
import { Paint } from './Paint'
import { taskAt, type BlockState, type Station } from './armTask'
import { RobotArm } from './RobotArm'
import {
  BLOCK,
  COLORS,
  Pieces,
  TABLE,
  block,
  cable,
  cableReel,
  cone,
  crate,
  groundY,
  shed,
  shelf,
  tape,
  testTable,
  tray,
  workbench,
} from './parts'

// Robot corner: a small workshop on the west headland, with two robot arms side by side
// doing the same pick-and-place task (blocks into a tray), to compare two ways of
// teaching them (ACT and flow matching). Open shed with a workbench behind them.
// Placeholder shapes, life-size.
//
// Zone coordinates: `position` is the middle of the workshop on the ground, +x is east,
// +z is south. The open side of the shed and the arms face west, towards the sea.

// The concrete pad everything stands on: x and z from..to.
const PAD = { x: [-4.2, 9.5], z: [-6, 6] }

// The shed: open front and back wall (x), and how wide it is (along z).
const SHED = { front: 4, back: 9.5, width: 7 }

// The two test stations: the middle of each table. A is north, B is south.
const STATIONS = [
  { x: -1.2, z: -2.2, color: COLORS.stationA },
  { x: -1.2, z: 2.2, color: COLORS.stationB },
]

// On each table, relative to its middle: the arm at the back, the blocks to pick up on
// the front left, the tray on the front right (seen from the west).
const ARM_AT = 0.2
const PICK_AT: [number, number] = [-0.12, -0.4]
const TRAY_AT: [number, number] = [-0.12, 0.4]

// Invisible hitboxes, [centre, size] with y measured from the pad's top: a slab for the
// pad (everything on it is in front of it from the camera) and a box around the shed.
// Kept tight: the zone camera stands low, and anything taller would catch the pointer
// over the hills behind the workshop.
const HITBOXES: [Vec3, Vec3][] = [
  [[(PAD.x[0] + PAD.x[1]) / 2, -0.5, (PAD.z[0] + PAD.z[1]) / 2], [PAD.x[1] - PAD.x[0] + 0.3, 1.3, PAD.z[1] - PAD.z[0] + 0.3]],
  [[(SHED.front + SHED.back) / 2 - 0.3, 1.7, 0], [SHED.back - SHED.front + 1.2, 3.4, SHED.width + 0.8]],
]

type Props = {
  position: Vec3
  onSelect: (id: ProjectId) => void
}

export function RobotCorner({ position, onSelect }: Props) {
  const { hovered, handlers } = useZoneHover(() => onSelect('robotics'))

  // While hovered, every part lights up a little in its own colour.
  const glow = hovered ? 0.3 : 0

  const floor = useMemo(() => padHeight(position), [position])
  const meshes = useMemo(() => buildWorkshop(position, floor), [position, floor])
  const top = floor + TABLE.height

  // Both arms do the same task (armTask.ts), each with its own block, out of step.
  const tasks = useMemo(
    () =>
      STATIONS.map((_, i) => ({
        poseAt: (time: number) => taskAt(TASK, time, i + 1).pose,
        blockAt: (time: number) => taskAt(TASK, time, i + 1).block,
      })),
    [],
  )

  return (
    <group position={position}>
      {meshes.map(({ color, geometry }) => (
        <mesh key={color} geometry={geometry} castShadow receiveShadow>
          <Paint color={color} emissive={color} glow={glow} />
        </mesh>
      ))}

      {STATIONS.map((s, i) => (
        <group key={i} position={[s.x + ARM_AT, top, s.z]}>
          <RobotArm position={[0, 0, 0]} poseAt={tasks[i]!.poseAt} accent={s.color} glow={glow} />
          <TaskBlock stateAt={tasks[i]!.blockAt} color={TASK_BLOCKS[i]!} glow={glow} />
        </group>
      ))}

      {/* The hitboxes catch hover and clicks for the whole zone. visible={false}: not
          drawn, but the pointer still hits them. */}
      {HITBOXES.map(([[x, y, z], size], i) => (
        <mesh key={i} position={[x, floor + y, z]} visible={false} {...handlers}>
          <boxGeometry args={size} />
        </mesh>
      ))}
    </group>
  )
}

// The task in arm coordinates (the arm's base at the origin, on the table top): the block
// starts at the pick spot, and goes into the tray (whose floor is 1 cm up).
const TASK: Station = {
  pick: [PICK_AT[0] - ARM_AT, 0, PICK_AT[1]],
  tray: [TRAY_AT[0] - ARM_AT, 0.01, TRAY_AT[1]],
}
// The colour of the block each arm works with.
const TASK_BLOCKS = [COLORS.red, COLORS.green]

// The block an arm is working with. Every frame it asks where it is now (`stateAt`), so it
// moves with the arm, falls when it slips, and shrinks and grows between tries.
function TaskBlock({ stateAt, color, glow }: { stateAt: (time: number) => BlockState; color: string; glow: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const { position, turn, tilt, scale } = stateAt(clock.elapsedTime)
    mesh.position.set(...position)
    mesh.rotation.set(0, turn, tilt)
    mesh.scale.setScalar(Math.max(scale, 0.001))
    mesh.visible = scale > 0.001
  })
  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
      <Paint color={color} emissive={color} glow={glow} />
    </mesh>
  )
}

// The pad's top: just above the highest ground under it, so it never disappears into a bump.
function padHeight(origin: Vec3) {
  let high = -Infinity
  for (let x = PAD.x[0]; x <= PAD.x[1]; x += 1) {
    for (let z = PAD.z[0]; z <= PAD.z[1]; z += 1) high = Math.max(high, groundY(origin, x, z))
  }
  return high + 0.08
}

// Builds the pad, shed, tables and props, and merges them into one mesh per colour. Runs once.
function buildWorkshop(origin: Vec3, floor: number) {
  const p = new Pieces()

  // Concrete pad, deep enough to reach into the ground at its lowest corner.
  let low = Infinity
  for (let x = PAD.x[0]; x <= PAD.x[1]; x += 1) {
    for (let z = PAD.z[0]; z <= PAD.z[1]; z += 1) low = Math.min(low, groundY(origin, x, z))
  }
  const bottom = low - 0.5
  const [x0, x1] = PAD.x
  const [z0, z1] = PAD.z
  p.box(COLORS.concrete, [(x0 + x1) / 2, (floor + bottom) / 2, (z0 + z1) / 2], [x1 - x0, floor - bottom, z1 - z0])
  // A darker line round the top edge.
  p.box(COLORS.concreteDark, [(x0 + x1) / 2, floor - 0.06, (z0 + z1) / 2], [x1 - x0 + 0.04, 0.1, z1 - z0 + 0.04])

  shed(p, floor, SHED.front, SHED.back, SHED.width)
  workbench(p, floor, SHED.back - 0.47, 4.5)
  shelf(p, floor, (SHED.front + SHED.back) / 2 + 0.6, SHED.width / 2 - 0.3)

  // The two test stations: tape on the floor, a table, blocks and a tray. Both have the
  // same task: one block in the tray already and one dropped on the floor. The block each
  // arm is moving isn't here: it moves, so it's its own mesh (TaskBlock).
  const top = floor + TABLE.height
  const startBlocks: [string, number, number][] = [
    [COLORS.yellow, 0.08, -0.07],
    [COLORS.blue, -0.08, 0.07],
  ]
  for (const [i, s] of STATIONS.entries()) {
    tape(p, s.color, floor, s.x, s.z, 2.6, 2.4)
    testTable(p, floor, s.x, s.z)
    tray(p, [s.x + TRAY_AT[0], top, s.z + TRAY_AT[1]])
    block(p, COLORS.blue, [s.x + TRAY_AT[0] + 0.07, top + 0.01, s.z + TRAY_AT[1] - 0.06], [0, 0.3, 0])
    for (const [color, dx, dz] of startBlocks) {
      block(p, color, [s.x + PICK_AT[0] + dx, top, s.z + PICK_AT[1] + dz], [0, dx * 4, 0])
    }
    // The dropped block, lying on its side on the floor in front of the table.
    block(p, i === 0 ? COLORS.yellow : COLORS.red, [s.x - 0.75, floor, s.z + (i === 0 ? 0.35 : -0.3)], [0, 0.7 + i, 0])
    // The arm's cable, along the floor to the shed.
    cable(p, floor, [
      [s.x + 0.2, s.z],
      [1.2, s.z * 0.8],
      [SHED.front + 0.6, s.z * 0.5],
    ])
  }

  // Props around the workshop.
  crate(p, [2.8, floor, -4.9], 0.6, 0.2)
  crate(p, [3.6, floor, -4.6], 0.5, -0.3)
  crate(p, [2.85, floor + 0.6, -4.85], 0.42, 0.6)
  cableReel(p, [2.8, floor, 4.8], 0.5)
  cone(p, [-3.7, floor, -5.4])
  cone(p, [-3.7, floor, 5.4])

  return p.build()
}

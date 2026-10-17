import { useMemo } from 'react'
import * as THREE from 'three'
import { atHome, type Place, type Vec3 } from '../../scene/layout'
import { useZoneHover } from '../../scene/useZoneHover'
import { Contact } from './Contact'
import { MergedMeshes } from './Hotspot'
import { IslandMap } from './IslandMap'
import { NoticeBoard } from './NoticeBoard'
import { COLORS, HUT, Pieces, boardwalk, bush, deckChair, firePit, groundY, hitSheet, hut, hutFloor, palm, parasol, place, random, surfboard, towel } from './parts'
import { Sign } from './Sign'

// Home: a welcome hut on the south beach, where the site starts. It isn't a project: the
// things around the hut are the personal info, each one clickable:
//   - the welcome sign: name, tagline and About me          (Sign.tsx)
//   - the notice board on the hut: skills and tools, the CV (NoticeBoard.tsx)
//   - the mailbox with postcards: socials and contact      (Contact.tsx)
//   - the island map: a pin per zone, click one to fly there (IslandMap.tsx)
// Clicking one flies the camera up to it (the spots and their viewpoints are in spots.ts).
// Around them: the hut on stilts with a porch, a boardwalk, deck chairs, a parasol, a fire
// pit and palm trees. Placeholder shapes, life-size.
//
// From far away (the overview or another zone) the whole beach is one thing to click,
// which flies back to the start view.
//
// Zone coordinates: `position` is the middle of the hut on the ground, +x is east, +z is
// south (towards the sea). The hut faces south. Shapes are in parts.ts.

const SEED = 4 // change it for a different (but always the same) random beach

// Props: [x, z, turn]. Turn is in radians around y: 0 faces south.
const SURFBOARD: Vec3 = [-3.7, 4.4, 0]
const CHAIRS: Vec3[] = [
  [5.6, 6, -0.15],
  [7.1, 6.4, -0.35],
]
const PARASOL: [number, number] = [6.4, 5.8]
const TOWEL: Vec3 = [6.4, 10.4, 0.3]
const FIRE_PIT: [number, number] = [-7.6, 5.6]
// Palms: [x, z, height, lean towards +x, turn].
const PALMS: [number, number, number, number, number][] = [
  [-6.8, 2.2, 6.5, 1.8, 2.6],
  [7.2, 0.6, 7.2, 2.2, 0.3],
  [11, 4.5, 5.6, 1.6, -0.3],
]
const BUSHES: [number, number][] = [
  [-3.8, -3.2],
  [3.9, -3.4],
  [0.9, -3.9],
  [-8.5, -1.5],
]

// The boardwalk runs from the bottom of the porch steps this far south.
const PATH_END = 11

// Invisible hitboxes for clicking the beach from far away: a box around the hut, and a
// sheet draped over the beach (x and z from..to), HIT_HEIGHT above the sand.
const HIT_AREA = { x: [-10, 11], z: [-5, 13] }
const HIT_STEP = 2
const HIT_HEIGHT = 1.2

type Props = {
  position: Vec3
  place: Place | null // where the camera is now
  onSelect: (place: Place) => void
}

export function Home({ position, place, onSelect }: Props) {
  // At Home, each object is clickable on its own. Anywhere else, the whole beach is.
  const here = atHome(place)
  const { hovered, handlers } = useZoneHover(() => onSelect('home'), !here)

  const floor = useMemo(() => hutFloor(position), [position])
  const meshes = useMemo(() => buildBeach(position, floor), [position, floor])
  const sheet = useMemo(() => hitSheet(position, HIT_AREA, HIT_STEP, HIT_HEIGHT), [position])

  // The hut's hitbox: from the lowest ground under it to the top of the roof.
  const hutBox = useMemo(() => {
    const low = groundY(position, 0, HUT.depth / 2 + HUT.porch + 1)
    const high = floor + HUT.wall + HUT.roof + 0.3
    const back = -HUT.depth / 2 - 0.5
    const front = HUT.depth / 2 + HUT.porch + 1.2
    return { centre: [0, (low + high) / 2, (back + front) / 2] as Vec3, size: [HUT.width + 1.2, high - low, front - back] as Vec3 }
  }, [position, floor])

  const objects = { origin: position, enabled: here, lit: hovered, onSelect }

  return (
    <group position={position}>
      <MergedMeshes meshes={meshes} glow={hovered ? 0.3 : 0} />

      <Sign {...objects} />
      <NoticeBoard {...objects} />
      <Contact {...objects} />
      <IslandMap {...objects} />

      {/* The hitboxes for clicking the whole beach, only while the camera is elsewhere.
          visible={false}: not drawn, but the pointer still hits them. DoubleSide so the
          sheet is hit from above. */}
      {!here && (
        <>
          <mesh position={hutBox.centre} visible={false} {...handlers}>
            <boxGeometry args={hutBox.size} />
          </mesh>
          <mesh geometry={sheet} visible={false} {...handlers}>
            <meshBasicMaterial side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  )
}

// Builds the hut and the props around it, and merges them into one mesh per colour. Runs once.
function buildBeach(origin: Vec3, floor: number) {
  const rand = random(SEED)
  const p = new Pieces()
  // A matrix for a prop standing on the sand at (x, z), turned by `turn`.
  const at = (x: number, z: number, turn = 0, sink = 0) => place([x, groundY(origin, x, z) - sink, z], [0, turn, 0])

  const steps = hut(p, origin, floor)
  boardwalk(p, origin, steps + 0.15, PATH_END)
  surfboard(p, at(SURFBOARD[0], SURFBOARD[1], SURFBOARD[2], 0.2))

  for (const [i, [x, z, turn]] of CHAIRS.entries()) deckChair(p, at(x, z, turn), i === 0 ? COLORS.chairBlue : COLORS.chairOrange)
  parasol(p, at(PARASOL[0], PARASOL[1]))
  towel(p, at(TOWEL[0], TOWEL[1], TOWEL[2]))
  firePit(p, at(FIRE_PIT[0], FIRE_PIT[1]), rand)

  for (const [x, z, height, lean, turn] of PALMS) palm(p, at(x, z, turn), height, lean, rand)
  for (const [x, z] of BUSHES) bush(p, at(x, z, 0, 0.15), rand)

  return p.build()
}

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { heightAt } from '../../scene/islandShape'
import type { Vec3 } from '../../scene/layout'

// Colours, helpers and the shapes of the Home beach: the hut and the props around it.
// Zone coordinates: `origin` is the zone's position on the ground, +x is east, +z is south
// (towards the sea). The hut's front faces south.

export const COLORS = {
  wall: '#8fd3c6', // soft mint
  trim: '#fbf7ee',
  roof: '#e5674b',
  roofDark: '#c25039',
  plank: '#d9b27c',
  wood: '#a9774a',
  woodDark: '#77522f',
  door: '#f2c14e',
  glass: '#bfe6ff',
  mailbox: '#3d7fd1',
  flag: '#e2402e',
  flowerRed: '#ef5b5b',
  flowerPink: '#ff9ec4',
  flowerYellow: '#ffd23f',
  leaf: '#5aa84a',
  bush: '#4f9a44',
  trunk: '#a07a52',
  trunkDark: '#8a6644',
  palm: '#62b34f',
  coconut: '#6b4a2b',
  stone: '#9a958c',
  ash: '#4a4643',
  chairBlue: '#4fb3d9',
  chairOrange: '#f2a541',
  parasolRed: '#ef5b5b',
  white: '#ffffff',
  towel: '#4fb3d9',
  bucket: '#e2402e',
  spade: '#ffd23f',
  surfboard: '#ff8a5c',
  lantern: '#ffd36b',
  metal: '#3a3d42',
}

// The hut: centred on the zone's middle, front (with the porch) facing south.
export const HUT = { width: 5, depth: 4, wall: 2.4, roof: 1.3, porch: 1.8 }

// The hut's floor: 70 cm above the highest sand under it, so the stilts are never buried.
export function hutFloor(origin: Vec3) {
  let high = -Infinity
  const hw = HUT.width / 2
  for (let x = -hw; x <= hw; x += 0.5) {
    for (let z = -HUT.depth / 2; z <= HUT.depth / 2 + HUT.porch; z += 0.5) high = Math.max(high, groundY(origin, x, z))
  }
  return high + 0.7
}

// Ground height at a spot in zone coordinates (relative to the zone's position).
export function groundY(origin: Vec3, x: number, z: number) {
  return heightAt(origin[0] + x, origin[2] + z) - origin[1]
}

const UP = new THREE.Vector3(0, 1, 0)

// Position, rotation (radians) and scale in one matrix.
export function place(pos: THREE.Vector3 | Vec3, rot: [number, number, number] = [0, 0, 0], scale: number | Vec3 = 1) {
  const p = Array.isArray(pos) ? new THREE.Vector3(...pos) : pos
  const s = typeof scale === 'number' ? new THREE.Vector3(scale, scale, scale) : new THREE.Vector3(...scale)
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot))
  return new THREE.Matrix4().compose(p, q, s)
}

// A cylinder from point a to point b.
export function stick(a: Vec3, b: Vec3, radius: number, tipRadius = radius, sides = 6) {
  const from = new THREE.Vector3(...a)
  const dir = new THREE.Vector3(...b).sub(from)
  const g = new THREE.CylinderGeometry(tipRadius, radius, dir.length(), sides)
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
  g.applyMatrix4(new THREE.Matrix4().compose(from.addScaledVector(dir, 0.5), q, new THREE.Vector3(1, 1, 1)))
  return g
}

const SAME = new THREE.Matrix4()

// Collects many small pieces, sorted by colour, and glues each colour into one geometry
// ("merging"). The whole beach then draws as a few dozen meshes instead of hundreds.
export class Pieces {
  private groups = new Map<string, THREE.BufferGeometry[]>()

  // `m` moves the piece into place. Builders for props pass the prop's own matrix, so
  // they can be written as if the prop stands at (0, 0, 0) facing south.
  add(color: string, g: THREE.BufferGeometry, m: THREE.Matrix4 = SAME) {
    // Merging needs every piece in the same format, so turn shared corners into separate ones.
    const piece = g.index ? g.toNonIndexed() : g.clone()
    piece.applyMatrix4(m)
    const list = this.groups.get(color) ?? []
    list.push(piece)
    this.groups.set(color, list)
    g.dispose()
  }

  // A box by its centre and size, turned by `rot`, then moved by `m`.
  box(color: string, centre: Vec3, size: Vec3, rot: [number, number, number] = [0, 0, 0], m: THREE.Matrix4 = SAME) {
    this.add(color, new THREE.BoxGeometry(...size), m.clone().multiply(place(centre, rot)))
  }

  build() {
    return [...this.groups].map(([color, list]) => ({ color, geometry: mergeGeometries(list) }))
  }
}

// ---------- the hut ----------
// In zone coordinates; `floor` is the height of the hut's floor (on stilts above the sand).
// Returns where the porch steps end (z), so the path can start there.

export function hut(p: Pieces, origin: Vec3, floor: number) {
  const { width, depth, wall, roof, porch } = HUT
  const hw = width / 2
  const hd = depth / 2
  const front = hd + porch // front edge of the porch
  const top = floor + wall // top of the walls

  // Stilts down into the sand, with beams under the floor.
  for (const z of [-hd + 0.1, 0, hd, front - 0.15]) {
    for (const x of [-hw + 0.1, 0, hw - 0.1]) {
      const ground = groundY(origin, x, z)
      p.box(COLORS.woodDark, [x, (ground - 0.3 + floor) / 2, z], [0.18, floor - ground + 0.3, 0.18])
    }
    p.box(COLORS.woodDark, [0, floor - 0.2, z], [width, 0.14, 0.14])
  }
  // Floor and porch deck, with a plank line every 30 cm.
  p.box(COLORS.plank, [0, floor - 0.06, (front - hd - 0.1) / 2], [width + 0.2, 0.12, front + hd + 0.1])
  for (let x = -hw + 0.3; x < hw; x += 0.3) p.box(COLORS.wood, [x, floor, (hd + front) / 2], [0.02, 0.01, porch])

  // Walls with white corner posts.
  p.box(COLORS.wall, [0, floor + wall / 2, 0], [width, wall, depth])
  for (const x of [-hw, hw]) {
    for (const z of [-hd, hd]) p.box(COLORS.trim, [x, floor + wall / 2, z], [0.14, wall, 0.14])
  }
  p.box(COLORS.trim, [0, top - 0.05, hd + 0.01], [width + 0.1, 0.1, 0.06])

  // The two gable ends: triangles of wall under the roof, with a round window in front.
  const triangle = new THREE.Shape([new THREE.Vector2(-hw, 0), new THREE.Vector2(hw, 0), new THREE.Vector2(0, roof)])
  const gable = new THREE.ExtrudeGeometry(triangle, { depth, bevelEnabled: false })
  p.add(COLORS.wall, gable, place([0, top, -hd]))
  p.add(COLORS.trim, new THREE.CylinderGeometry(0.26, 0.26, 0.05, 12), place([0, top + 0.5, hd + 0.02], [Math.PI / 2, 0, 0]))
  p.add(COLORS.glass, new THREE.CylinderGeometry(0.19, 0.19, 0.05, 12), place([0, top + 0.5, hd + 0.04], [Math.PI / 2, 0, 0]))

  // Roof: two slabs from the ridge down past the walls, running on over the porch.
  const slope = Math.atan2(roof, hw)
  const overhang = 0.4
  const run = hw + overhang
  const length = run / Math.cos(slope)
  const back = -hd - 0.35
  const roofFront = front + 0.2
  for (const side of [-1, 1]) {
    // Middle of the slab: halfway from the ridge to the eave, lifted half its thickness.
    const cx = (side * run) / 2 + side * Math.sin(slope) * 0.07
    const cy = top + roof - (run / 2) * Math.tan(slope) + Math.cos(slope) * 0.07
    p.box(COLORS.roof, [cx, cy, (back + roofFront) / 2], [length, 0.14, roofFront - back], [0, 0, -side * slope])
  }
  p.box(COLORS.roofDark, [0, top + roof + 0.1, (back + roofFront) / 2], [0.3, 0.12, roofFront - back + 0.04])

  // Porch: two posts holding the roof, a beam across the front, a railing with a gap
  // for the steps, and a lantern over the steps.
  const postZ = front - 0.15
  for (const x of [-hw + 0.1, hw - 0.1]) p.box(COLORS.trim, [x, floor + wall / 2, postZ], [0.14, wall, 0.14])
  p.box(COLORS.trim, [0, top - 0.06, postZ], [width + 0.1, 0.14, 0.12])
  const rail = (a: [number, number], b: [number, number]) => {
    const [ax, az] = a
    const [bx, bz] = b
    const len = Math.hypot(bx - ax, bz - az)
    const turn = Math.atan2(-(bz - az), bx - ax)
    p.box(COLORS.trim, [(ax + bx) / 2, floor + 0.85, (az + bz) / 2], [len, 0.07, 0.07], [0, turn, 0])
    for (let t = 0; t <= len + 0.01; t += 0.3) {
      const k = t / len
      p.box(COLORS.trim, [ax + (bx - ax) * k, floor + 0.42, az + (bz - az) * k], [0.05, 0.84, 0.05])
    }
  }
  rail([-hw + 0.1, hd], [-hw + 0.1, postZ])
  rail([hw - 0.1, hd], [hw - 0.1, postZ])
  rail([-hw + 0.1, postZ], [-0.7, postZ])
  rail([0.7, postZ], [hw - 0.1, postZ])
  p.box(COLORS.metal, [0, top - 0.2, postZ + 0.1], [0.03, 0.14, 0.03])
  p.box(COLORS.lantern, [0, top - 0.4, postZ + 0.1], [0.16, 0.24, 0.16])
  p.box(COLORS.metal, [0, top - 0.26, postZ + 0.1], [0.2, 0.04, 0.2])

  // Steps down to the sand, each one a solid block down to the ground.
  const bottom = groundY(origin, 0, front + 0.8)
  const count = Math.max(1, Math.ceil((floor - bottom) / 0.25))
  const rise = (floor - bottom) / count
  for (let i = 1; i <= count; i++) {
    const z = front + (i - 0.5) * 0.3
    const stepTop = floor - i * rise
    const ground = groundY(origin, 0, z)
    p.box(COLORS.plank, [0, (stepTop + ground - 0.2) / 2, z], [1.3, stepTop - ground + 0.2, 0.3])
  }

  // Front wall: door in the middle, a window on the left. The notice board on the right is
  // its own clickable object (NoticeBoard.tsx).
  const face = hd + 0.02
  p.box(COLORS.trim, [0, floor + 1.02, face], [1.06, 2.04, 0.04])
  p.box(COLORS.door, [0, floor + 0.97, face + 0.02], [0.9, 1.94, 0.04])
  p.box(COLORS.metal, [0.32, floor + 1.0, face + 0.06], [0.06, 0.06, 0.05])
  windowAt(p, place([-1.55, floor + 1.45, face]))
  flowerBox(p, place([-1.55, floor + 0.95, face]))
  // A window in each side wall.
  windowAt(p, place([hw + 0.02, floor + 1.45, 0], [0, Math.PI / 2, 0]))
  windowAt(p, place([-hw - 0.02, floor + 1.45, 0], [0, -Math.PI / 2, 0]))

  return front + count * 0.3
}

// A window with a white frame and a cross bar, on a wall facing +z.
function windowAt(p: Pieces, m: THREE.Matrix4) {
  p.box(COLORS.trim, [0, 0, 0.01], [0.97, 0.87, 0.04], undefined, m)
  p.box(COLORS.glass, [0, 0, 0.03], [0.82, 0.72, 0.03], undefined, m)
  p.box(COLORS.trim, [0, 0, 0.05], [0.05, 0.72, 0.03], undefined, m)
  p.box(COLORS.trim, [0, 0, 0.05], [0.82, 0.05, 0.03], undefined, m)
}

// A wooden box of flowers under a window.
function flowerBox(p: Pieces, m: THREE.Matrix4) {
  p.box(COLORS.wood, [0, 0, 0.12], [0.95, 0.2, 0.22], undefined, m)
  const colors = [COLORS.flowerRed, COLORS.flowerYellow, COLORS.flowerPink]
  for (let i = 0; i < 6; i++) {
    const x = -0.38 + i * 0.152
    p.add(COLORS.leaf, new THREE.IcosahedronGeometry(0.08, 0), m.clone().multiply(place([x, 0.13, 0.12])))
    p.add(colors[i % 3], new THREE.IcosahedronGeometry(0.06, 0), m.clone().multiply(place([x + 0.03, 0.2, 0.15])))
  }
}

// ---------- props ----------
// Each builder gets a matrix `m` for where the prop stands; inside it the prop stands at
// (0, 0, 0) on the ground and faces south (+z).

// The clickable objects' stands and frames. Each is built around its own (0, 0, 0): on the
// ground, front facing +z. The painted pictures go on top of them (Home.tsx and friends).

// The welcome sign: a board on two posts with a little roof. `bottom` is the board's lower edge.
export function signStand(p: Pieces, width: number, height: number, bottom: number) {
  const top = bottom + height
  for (const x of [-width / 2 + 0.15, width / 2 - 0.15]) p.box(COLORS.woodDark, [x, (top - 0.4) / 2, -0.06], [0.14, top + 0.4, 0.14])
  p.box(COLORS.wood, [0, bottom + height / 2, -0.02], [width + 0.16, height + 0.16, 0.06])
  // Roof: two planks meeting over the board.
  for (const side of [-1, 1]) {
    p.box(COLORS.roof, [(side * (width + 0.4)) / 4, top + 0.2, -0.04], [(width + 0.5) / 2 / Math.cos(0.3), 0.06, 0.4], [0, 0, -side * 0.3])
  }
}

// A cork board's wooden frame, `width` by `height`, its middle at (0, 0, 0) on a wall.
export function boardFrame(p: Pieces, width: number, height: number) {
  p.box(COLORS.wood, [0, 0, 0.02], [width, height, 0.05])
  p.box(COLORS.woodDark, [0, -height / 2 - 0.02, 0.07], [width + 0.04, 0.05, 0.1]) // a ledge along the bottom
}

// The island map on a stand: two legs, a frame, and a slanted rain cover on top.
export function mapStand(p: Pieces, width: number, height: number, bottom: number) {
  const top = bottom + height
  for (const x of [-width / 2 - 0.05, width / 2 + 0.05]) p.box(COLORS.woodDark, [x, (top - 0.4) / 2, -0.05], [0.12, top + 0.4, 0.12])
  p.box(COLORS.wood, [0, bottom + height / 2, -0.04], [width + 0.14, height + 0.14, 0.06])
  p.box(COLORS.roof, [0, top + 0.16, 0.08], [width + 0.4, 0.06, 0.45], [0.35, 0, 0])
}

// The "Find me" board under the mailbox, on two posts; the mailbox sits on the middle post.
export function contactStand(p: Pieces, width: number, height: number, bottom: number) {
  for (const x of [-width / 2 + 0.06, width / 2 - 0.06]) p.box(COLORS.woodDark, [x, (bottom + height - 0.3) / 2, -0.05], [0.08, bottom + height + 0.3, 0.08])
  p.box(COLORS.wood, [0, bottom + height / 2, -0.03], [width + 0.08, height + 0.08, 0.04])
}

// A mailbox on a post (for contact), with its red flag up.
export function mailbox(p: Pieces, m: THREE.Matrix4 = SAME) {
  p.box(COLORS.woodDark, [0, 0.45, 0], [0.09, 1.1, 0.09], undefined, m)
  p.box(COLORS.mailbox, [0, 1.08, 0], [0.3, 0.24, 0.46], undefined, m)
  p.add(COLORS.mailbox, new THREE.CylinderGeometry(0.15, 0.15, 0.46, 10), m.clone().multiply(place([0, 1.2, 0], [Math.PI / 2, 0, 0])))
  p.box(COLORS.metal, [0, 1.12, 0.235], [0.2, 0.16, 0.01], undefined, m)
  p.box(COLORS.flag, [0.17, 1.2, -0.05], [0.02, 0.3, 0.03], undefined, m)
  p.box(COLORS.flag, [0.17, 1.32, 0.04], [0.02, 0.1, 0.16], undefined, m)
}

// A wooden path of planks across the sand, from (0, z0) to (0, z1), following the ground.
export function boardwalk(p: Pieces, origin: Vec3, z0: number, z1: number) {
  for (let z = z0; z < z1; z += 0.26) p.box(COLORS.plank, [0, groundY(origin, 0, z) + 0.03, z], [1.2, 0.08, 0.2])
}

// A palm tree, leaning over by `lean` metres at the top, towards +x.
export function palm(p: Pieces, m: THREE.Matrix4, height: number, lean: number, rand: () => number) {
  const steps = 8
  let last: Vec3 = [0, -0.3, 0]
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const next: Vec3 = [lean * t * t, height * t, 0]
    const r = 0.22 - 0.09 * t
    p.add(i % 2 ? COLORS.trunk : COLORS.trunkDark, stick(last, next, r + 0.02, r, 7), m)
    last = next
  }
  // Leaves: each one three flat pieces bending outwards and down.
  const leaves = 8
  for (let i = 0; i < leaves; i++) {
    const turn = (i / leaves) * Math.PI * 2 + rand() * 0.4
    const at = m.clone().multiply(place(last, [0, turn, 0]))
    let x = 0
    let y = 0
    for (const [len, angle, w] of [
      [1.1, 0.35, 0.5],
      [1.2, -0.25, 0.42],
      [0.9, -0.85, 0.26],
    ]) {
      const cx = x + (Math.cos(angle) * len) / 2
      const cy = y + (Math.sin(angle) * len) / 2
      p.box(COLORS.palm, [cx, cy, 0], [len, 0.04, w], [0, 0, angle], at)
      x += Math.cos(angle) * len
      y += Math.sin(angle) * len
    }
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    p.add(COLORS.coconut, new THREE.IcosahedronGeometry(0.13, 0), m.clone().multiply(place([last[0] + Math.cos(a) * 0.2, last[1] - 0.2, Math.sin(a) * 0.2])))
  }
}

// A deck chair facing south: a low seat with a back leaning back, and a striped cushion.
export function deckChair(p: Pieces, m: THREE.Matrix4, color: string) {
  for (const x of [-0.27, 0.27]) {
    for (const z of [-0.2, 1.0]) p.box(COLORS.wood, [x, 0.15, z], [0.05, 0.3, 0.05], undefined, m)
    p.box(COLORS.wood, [x, 0.3, 0.4], [0.05, 0.05, 1.3], undefined, m)
  }
  p.box(color, [0, 0.34, 0.45], [0.55, 0.04, 1.1], undefined, m)
  const back = -0.75 // radians: leaning back towards -z
  p.box(color, [0, 0.34 + Math.cos(back) * 0.38, -0.12 + Math.sin(back) * 0.38], [0.55, 0.76, 0.04], [back, 0, 0], m)
  for (let i = 0; i < 3; i++) p.box(COLORS.white, [0, 0.365, 0.1 + i * 0.32], [0.56, 0.01, 0.1], undefined, m)
}

// A beach parasol: a pole with a canopy of red and white segments.
export function parasol(p: Pieces, m: THREE.Matrix4) {
  p.add(COLORS.white, stick([0, -0.3, 0], [0, 2.3, 0], 0.03), m)
  const segments = 8
  for (let i = 0; i < segments; i++) {
    // A slice of a cone: a cylinder with a 0 radius top, only part of the way round.
    const g = new THREE.CylinderGeometry(0.02, 1.25, 0.42, 1, 1, false, (i / segments) * Math.PI * 2, (Math.PI * 2) / segments)
    p.add(i % 2 ? COLORS.white : COLORS.parasolRed, g, m.clone().multiply(place([0, 2.15, 0])))
  }
}

// A beach towel with stripes, with a bucket and spade next to it.
export function towel(p: Pieces, m: THREE.Matrix4) {
  p.box(COLORS.towel, [0, 0.02, 0], [0.9, 0.03, 1.8], undefined, m)
  for (const z of [-0.6, 0, 0.6]) p.box(COLORS.white, [0, 0.04, z], [0.9, 0.01, 0.16], undefined, m)
  p.add(COLORS.bucket, new THREE.CylinderGeometry(0.13, 0.1, 0.2, 10), m.clone().multiply(place([0.75, 0.1, 0.5])))
  p.add(COLORS.metal, new THREE.TorusGeometry(0.12, 0.008, 4, 12, Math.PI), m.clone().multiply(place([0.75, 0.2, 0.5])))
  p.add(COLORS.spade, stick([0.7, 0.04, 0.85], [0.95, 0.06, 1.25], 0.015), m)
  p.box(COLORS.spade, [0.68, 0.04, 0.78], [0.12, 0.02, 0.16], [0, -0.55, 0], m)
}

// A surfboard stuck upright in the sand.
export function surfboard(p: Pieces, m: THREE.Matrix4) {
  const board = new THREE.SphereGeometry(1, 10, 8)
  p.add(COLORS.surfboard, board, m.clone().multiply(place([0, 0.95, 0], [0.1, 0.4, 0.12], [0.27, 1.1, 0.05])))
  p.box(COLORS.white, [0, 0.95, 0], [0.04, 1.9, 0.11], [0.1, 0.4, 0.12], m)
}

// A fire pit: a ring of stones with crossed logs, and two log seats.
export function firePit(p: Pieces, m: THREE.Matrix4, rand: () => number) {
  const stones = 10
  for (let i = 0; i < stones; i++) {
    const a = (i / stones) * Math.PI * 2
    const s = 0.14 + rand() * 0.05
    p.add(COLORS.stone, new THREE.IcosahedronGeometry(1, 0), m.clone().multiply(place([Math.cos(a) * 0.55, s * 0.4, Math.sin(a) * 0.55], [rand(), rand() * 3, 0], [s, s * 0.75, s])))
  }
  p.add(COLORS.ash, new THREE.CylinderGeometry(0.45, 0.45, 0.04, 10), m)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI
    const dx = Math.cos(a) * 0.35
    const dz = Math.sin(a) * 0.35
    p.add(COLORS.woodDark, stick([-dx, 0.06, -dz], [dx, 0.22, dz], 0.06), m)
  }
  for (const [x, z, turn] of [
    [-1.4, 0.2, 1.4],
    [0.6, -1.35, 0.15],
  ]) {
    p.add(COLORS.wood, new THREE.CylinderGeometry(0.19, 0.19, 1.2, 9), m.clone().multiply(place([x, 0.17, z], [Math.PI / 2, turn, 0])))
  }
}

// A round bush: a few green balls.
export function bush(p: Pieces, m: THREE.Matrix4, rand: () => number) {
  for (let i = 0; i < 4; i++) {
    const s = 0.45 + rand() * 0.3
    p.add(i % 2 ? COLORS.bush : COLORS.leaf, new THREE.IcosahedronGeometry(s, 0), m.clone().multiply(place([(rand() - 0.5) * 0.9, s * 0.6, (rand() - 0.5) * 0.9], [rand(), rand(), 0])))
  }
}

// A seeded random number generator: the same seed gives the same "random" numbers every
// time, so the beach looks the same on every visit.
export function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// An invisible sheet `height` above the ground over an area (x and z from..to), with a
// point every `step` metres: a hitbox that follows the slope of the beach.
export function hitSheet(origin: Vec3, area: { x: number[]; z: number[] }, step: number, height: number) {
  const cols = Math.round((area.x[1] - area.x[0]) / step)
  const rows = Math.round((area.z[1] - area.z[0]) / step)
  const points: number[] = []
  const index: number[] = []
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const x = area.x[0] + i * step
      const z = area.z[0] + j * step
      points.push(x, groundY(origin, x, z) + height, z)
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

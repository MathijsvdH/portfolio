import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { heightAt } from '../../scene/islandShape'
import type { Vec3 } from '../../scene/layout'

// Colours, helpers and the workshop's scenery (pad, shed, bench, test tables, props).
// Zone coordinates: `origin` is the zone's position on the ground, +x is east, +z is south.
// The robot arm is in RobotArm.tsx.

export const COLORS = {
  concrete: '#b9b4aa',
  concreteDark: '#9d988e',
  wood: '#b0814f',
  woodDark: '#7d5a36',
  plank: '#c99a62',
  roof: '#7d8a94',
  pegboard: '#d2ae7a',
  tool: '#3a3d42',
  metal: '#8f969d',
  tableTop: '#e4ddd0',
  tableLeg: '#55595f',
  laptop: '#3d4148',
  screen: '#9fd3ff',
  toolbox: '#d8432e',
  bin: '#4a7fc0',
  binYellow: '#e8b62c',
  crate: '#a87a48',
  cone: '#ff7a1a',
  white: '#f4f4f2',
  cable: '#1f2124',
  reel: '#d8432e',
  tray: '#3c4046',
  // Blocks the arms pick up and place.
  red: '#e2402e',
  yellow: '#ffcd2e',
  green: '#4caf50',
  blue: '#2f7fe0',
  // Each test station has its own colour (tape, and the arm's accents), so the two
  // arms can be told apart.
  stationA: '#2f8fe8',
  stationB: '#f08a24',
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

// Collects many small pieces, sorted by colour, and glues each colour into one geometry
// ("merging"). The whole workshop then draws as a few dozen meshes instead of hundreds.
export class Pieces {
  private groups = new Map<string, THREE.BufferGeometry[]>()

  add(color: string, g: THREE.BufferGeometry, m: THREE.Matrix4) {
    // Merging needs every piece in the same format, so turn shared corners into separate ones.
    const piece = g.index ? g.toNonIndexed() : g.clone()
    piece.applyMatrix4(m)
    const list = this.groups.get(color) ?? []
    list.push(piece)
    this.groups.set(color, list)
    g.dispose()
  }

  // A box by its centre and size, turned by `rot`.
  box(color: string, centre: Vec3, size: Vec3, rot: [number, number, number] = [0, 0, 0]) {
    this.add(color, new THREE.BoxGeometry(...size), place(centre, rot))
  }

  build() {
    return [...this.groups].map(([color, list]) => ({ color, geometry: mergeGeometries(list) }))
  }
}

// ---------- scenery ----------
// Positions are in zone coordinates; `floor` is the height of the concrete pad's top.

// Open wooden shed: the open side faces west (-x), the roof slopes down towards the back.
// `front` and `back` are its x, `width` its size along z.
export function shed(p: Pieces, floor: number, front: number, back: number, width: number) {
  const high = 3.1 // roof height at the open front
  const low = 2.5 // and at the back wall
  const hz = width / 2
  for (const [x, h] of [
    [front, high],
    [back, low],
  ]) {
    for (const z of [-hz, hz]) p.box(COLORS.woodDark, [x, floor + h / 2, z], [0.15, h, 0.15])
  }
  // Back and side walls of planks, with a small gap between planks.
  for (let y = 0.15; y < low - 0.1; y += 0.32) {
    p.box(COLORS.plank, [back - 0.02, floor + y + 0.14, 0], [0.06, 0.28, width])
    for (const z of [-hz, hz]) p.box(COLORS.plank, [(front + back) / 2, floor + y + 0.14, z], [back - front, 0.28, 0.06])
  }
  // Roof: one sheet of metal, tilted down towards the back, overhanging on all sides.
  const run = back - front
  const tilt = Math.atan2(high - low, run)
  const length = Math.hypot(run, high - low) + 1.2
  p.box(COLORS.roof, [(front + back) / 2 - 0.3, floor + (high + low) / 2 + 0.1, 0], [length, 0.08, width + 0.8], [0, 0, -tilt])
  // A beam along the front, under the roof's edge.
  p.box(COLORS.woodDark, [front, floor + high - 0.08, 0], [0.16, 0.16, width])
}

// Workbench along the back wall, with a laptop, toolbox, spare gripper parts and a
// pegboard of tools above it. `x` is the bench's middle, it runs along z.
export function workbench(p: Pieces, floor: number, x: number, length: number) {
  const top = floor + 0.9
  const depth = 0.8
  p.box(COLORS.wood, [x, top - 0.03, 0], [depth, 0.06, length])
  p.box(COLORS.woodDark, [x, floor + 0.25, 0], [depth - 0.1, 0.04, length - 0.2]) // bottom shelf
  for (const dx of [-depth / 2 + 0.06, depth / 2 - 0.06]) {
    for (const z of [-length / 2 + 0.08, length / 2 - 0.08]) p.box(COLORS.woodDark, [x + dx, floor + (top - floor) / 2, z], [0.07, top - floor - 0.06, 0.07])
  }

  // Laptop: open, the screen tilted back, facing west (towards the visitor).
  p.box(COLORS.laptop, [x - 0.05, top + 0.01, -0.6], [0.24, 0.02, 0.34])
  p.box(COLORS.laptop, [x + 0.08, top + 0.13, -0.6], [0.02, 0.24, 0.34], [0, 0, 0.25])
  p.box(COLORS.screen, [x + 0.065, top + 0.13, -0.6], [0.005, 0.2, 0.3], [0, 0, 0.25])

  // Toolbox, a box of spare parts and a coil of cable.
  p.box(COLORS.toolbox, [x + 0.05, top + 0.11, 1.3], [0.24, 0.22, 0.46])
  p.box(COLORS.tool, [x + 0.05, top + 0.25, 1.3], [0.04, 0.04, 0.3])
  p.box(COLORS.bin, [x - 0.05, top + 0.07, 0.4], [0.3, 0.14, 0.4])
  p.add(COLORS.cable, new THREE.TorusGeometry(0.11, 0.025, 4, 12), place([x - 0.1, top + 0.025, -1.4], [Math.PI / 2, 0, 0]))
  // A spare gripper finger and a screwdriver lying on the bench.
  p.box(COLORS.metal, [x - 0.2, top + 0.015, 0.95], [0.12, 0.03, 0.04], [0, 0.5, 0])
  p.add(COLORS.toolbox, stick([x - 0.25, top + 0.015, -0.1], [x - 0.15, top + 0.015, 0.02], 0.014, 0.014, 5), new THREE.Matrix4())
  p.add(COLORS.metal, stick([x - 0.15, top + 0.015, 0.02], [x - 0.08, top + 0.015, 0.1], 0.005, 0.005, 4), new THREE.Matrix4())

  // Pegboard on the back wall, with tools hanging on it.
  const board = x + depth / 2 + 0.03
  p.box(COLORS.pegboard, [board, top + 0.8, 0], [0.03, 0.9, 2.4])
  const tools: [number, number, number][] = [
    [-0.9, 0.95, 0.35],
    [-0.6, 0.9, 0.25],
    [-0.3, 1.0, 0.45],
    [0.1, 0.85, 0.3],
    [0.4, 0.95, 0.4],
    [0.75, 0.9, 0.22],
  ]
  for (const [z, y, h] of tools) p.box(COLORS.tool, [board - 0.03, top + y, z], [0.02, h, 0.05])
}

// Steel shelf with bins of blocks and parts, against a side wall. Runs along x.
export function shelf(p: Pieces, floor: number, x: number, z: number) {
  const w = 1.6
  for (const dx of [-w / 2, w / 2]) for (const dz of [-0.2, 0.2]) p.box(COLORS.metal, [x + dx, floor + 0.9, z + dz], [0.04, 1.8, 0.04])
  const bins = [COLORS.bin, COLORS.binYellow, COLORS.bin, COLORS.binYellow, COLORS.bin, COLORS.bin]
  for (const [i, y] of [0.3, 0.9, 1.5].entries()) {
    p.box(COLORS.metal, [x, floor + y, z], [w, 0.03, 0.46])
    for (const k of [0, 1]) p.box(bins[i * 2 + k], [x + (k ? 0.38 : -0.38), floor + y + 0.1, z], [0.6, 0.18, 0.36])
  }
}

// Test table for one arm: `x`, `z` is its middle, `top` the height of the table top.
// The arm stands at the back (east), the blocks to pick up on the front left and the
// tray to put them in on the front right (seen from the visitor in the west).
export const TABLE = { depth: 0.9, length: 1.6, height: 0.78 }

export function testTable(p: Pieces, floor: number, x: number, z: number) {
  const top = floor + TABLE.height
  p.box(COLORS.tableTop, [x, top - 0.025, z], [TABLE.depth, 0.05, TABLE.length])
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) p.box(COLORS.tableLeg, [x + dx * (TABLE.depth / 2 - 0.06), floor + (TABLE.height - 0.05) / 2, z + dz * (TABLE.length / 2 - 0.06)], [0.05, TABLE.height - 0.05, 0.05])
  }
}

// A shallow tray the blocks go into. `pos` is its middle on the table top.
export function tray(p: Pieces, pos: Vec3, size = 0.34) {
  const [x, y, z] = pos
  const rim = 0.05
  p.box(COLORS.tray, [x, y + 0.005, z], [size, 0.01, size])
  for (const s of [-1, 1]) {
    p.box(COLORS.tray, [x + (s * size) / 2, y + rim / 2, z], [0.015, rim, size])
    p.box(COLORS.tray, [x, y + rim / 2, z + (s * size) / 2], [size, rim, 0.015])
  }
}

// A cube to pick up, 6 cm. `pos` is the middle of its bottom face.
export const BLOCK = 0.06
export function block(p: Pieces, color: string, pos: Vec3, rot: [number, number, number] = [0, 0, 0]) {
  p.box(color, [pos[0], pos[1] + BLOCK / 2, pos[2]], [BLOCK, BLOCK, BLOCK], rot)
}

// Floor tape around a test station: a rectangle of thin strips on the pad.
export function tape(p: Pieces, color: string, floor: number, x: number, z: number, sx: number, sz: number) {
  const y = floor + 0.004
  const w = 0.06
  for (const s of [-1, 1]) {
    p.box(color, [x + (s * sx) / 2, y, z], [w, 0.008, sz + w])
    p.box(color, [x, y, z + (s * sz) / 2], [sx + w, 0.008, w])
  }
}

// Wooden crate. `pos` is the middle of its bottom.
export function crate(p: Pieces, pos: Vec3, size: number, turn = 0) {
  const [x, y, z] = pos
  p.box(COLORS.crate, [x, y + size / 2, z], [size, size, size], [0, turn, 0])
  // Darker slats across two sides, so it reads as a crate and not a box.
  for (const h of [0.25, 0.75]) p.box(COLORS.woodDark, [x, y + size * h, z], [size + 0.02, 0.05, size + 0.02], [0, turn, 0])
}

// Traffic cone with a white stripe. `pos` is the middle of its bottom.
export function cone(p: Pieces, pos: Vec3) {
  const [x, y, z] = pos
  p.box(COLORS.cone, [x, y + 0.015, z], [0.36, 0.03, 0.36])
  p.add(COLORS.cone, new THREE.ConeGeometry(0.15, 0.5, 10), place([x, y + 0.28, z]))
  p.add(COLORS.white, new THREE.CylinderGeometry(0.075, 0.095, 0.08, 10), place([x, y + 0.3, z]))
}

// A cable reel standing on its side. `pos` is where it touches the ground.
export function cableReel(p: Pieces, pos: Vec3, turn = 0) {
  const [x, y, z] = pos
  const r = 0.35
  const m = place([x, y + r, z], [Math.PI / 2, 0, turn])
  for (const s of [-1, 1]) p.add(COLORS.reel, new THREE.CylinderGeometry(r, r, 0.04, 12), m.clone().multiply(place([0, (s * 0.17), 0])))
  p.add(COLORS.cable, new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.3, 12), m)
}

// A cable lying on the floor through a list of points.
export function cable(p: Pieces, floor: number, points: [number, number][]) {
  const y = floor + 0.015
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]
    const [bx, bz] = points[i + 1]
    p.add(COLORS.cable, stick([ax, y, az], [bx, y, bz], 0.015, 0.015, 4), new THREE.Matrix4())
  }
}

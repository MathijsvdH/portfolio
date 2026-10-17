import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { heightAt } from '../../scene/islandShape'
import type { Vec3 } from '../../scene/layout'

// Colours, helpers and the meadow's scenery (trees, flowers, log, rocks, trail camera).
// Zone coordinates: `origin` is the zone's position on the ground, +x is east, +z is south.
// The animals are in animals.ts.

export const COLORS = {
  trunk: '#7a5232',
  pine: '#2f6b3a',
  pineLight: '#3d8044',
  leaves: '#4f9a3c',
  leavesLight: '#6fb04a',
  bark: '#8a6440',
  barkInside: '#d9b07a',
  rock: '#9a9286',
  stem: '#4a8a36',
  white: '#fbf6ea',
  yellow: '#ffd23a',
  purple: '#9a5ad8',
  red: '#e8402e',
  camo: '#55583a',
  camoDark: '#3a3c28',
  lens: '#1c1e22',
  strap: '#2c2a26',
  // Animals
  deer: '#a8703e',
  deerLight: '#e8d6b8',
  antler: '#e6d8bc',
  fox: '#e2722a',
  rabbit: '#a08c72',
  hedgehog: '#5e4630',
  hedgehogFace: '#c8a27a',
  robin: '#7a5a3a',
  robinBreast: '#ee6a2a',
  dark: '#2a2420',
}

// Ground height at a spot in zone coordinates (relative to the zone's position).
export function groundY(origin: Vec3, x: number, z: number) {
  return heightAt(origin[0] + x, origin[2] + z) - origin[1]
}

// A random number generator that gives the same numbers every time for the same seed,
// so the meadow looks the same on every visit.
export function random(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rand = () => number

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
// ("merging"). The whole meadow then draws as a few dozen meshes instead of thousands.
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

  build() {
    return [...this.groups].map(([color, list]) => ({ color, geometry: mergeGeometries(list) }))
  }
}

// ---------- scenery ----------
// Each one stands on the ground at y = 0; `m` places, turns and scales it.

// Pine: a trunk with three stacked cones. About 11 m tall at scale 1.
export function pine(p: Pieces, m: THREE.Matrix4, rand: Rand) {
  p.add(COLORS.trunk, new THREE.CylinderGeometry(0.22, 0.35, 4, 6), m.clone().multiply(place([0, 2, 0])))
  const tiers: [number, number, number][] = [
    [3, 3.2, 4.8], // bottom height, radius, cone height
    [5.4, 2.5, 4],
    [7.6, 1.7, 3.6],
  ]
  const color = rand() < 0.5 ? COLORS.pine : COLORS.pineLight
  for (const [y, r, h] of tiers) {
    p.add(color, new THREE.ConeGeometry(r, h, 7), m.clone().multiply(place([0, y + h / 2, 0], [0, rand() * 3, 0])))
  }
}

// Leafy tree: a trunk with a few round blobs of leaves. About 8 m tall at scale 1.
export function leafyTree(p: Pieces, m: THREE.Matrix4, rand: Rand) {
  p.add(COLORS.trunk, stick([0, 0, 0], [0.2, 4.2, 0], 0.4, 0.25), m)
  const color = rand() < 0.5 ? COLORS.leaves : COLORS.leavesLight
  const blobs: [number, number, number, number][] = [
    [0.2, 5.6, 0, 2.6],
    [1.5, 4.9, 0.6, 1.8],
    [-1.2, 5.0, -0.7, 1.9],
    [0.4, 6.8, -0.5, 1.7],
  ]
  for (const [x, y, z, r] of blobs) {
    p.add(color, new THREE.IcosahedronGeometry(r * (0.9 + rand() * 0.2), 0), m.clone().multiply(place([x, y, z], [rand(), rand(), rand()])))
  }
}

// A clump of wild flowers: thin stems with a coloured head on each. About 40 cm tall.
export function flowers(p: Pieces, color: string, m: THREE.Matrix4, rand: Rand) {
  const count = 6 + Math.floor(rand() * 5)
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2
    const d = rand() * 0.5
    const x = Math.cos(a) * d
    const z = Math.sin(a) * d
    const h = 0.25 + rand() * 0.25
    p.add(COLORS.stem, stick([x, 0, z], [x, h, z], 0.015, 0.01, 3), m)
    p.add(color, new THREE.IcosahedronGeometry(0.07, 0), m.clone().multiply(place([x, h, z])))
  }
}

// A fallen tree trunk lying on the grass, with the cut end showing. Length in metres.
export function fallenLog(p: Pieces, m: THREE.Matrix4, length: number) {
  const r = 0.38
  p.add(COLORS.bark, new THREE.CylinderGeometry(r, r * 1.1, length, 8), m.clone().multiply(place([0, r * 0.9, 0], [0, 0, Math.PI / 2])))
  p.add(COLORS.barkInside, new THREE.CircleGeometry(r * 0.92, 8), m.clone().multiply(place([length / 2 + 0.005, r * 0.9, 0], [0, Math.PI / 2, 0])))
  // A broken-off branch.
  p.add(COLORS.bark, stick([0.6, r * 1.5, 0], [1.1, r * 1.5 + 0.9, 0.3], 0.09, 0.05, 5), m)
}

// A lumpy rock. Low detail on purpose: the flat faces give the low-poly look.
export function rock(p: Pieces, m: THREE.Matrix4) {
  p.add(COLORS.rock, new THREE.IcosahedronGeometry(1, 0), m)
}

// Trail camera (camera trap): a camouflage box strapped to a tree trunk, looking out at
// the meadow. `m` puts it on the trunk's surface, facing +x. It takes a photo when an
// animal walks past.
export function trailCamera(p: Pieces, m: THREE.Matrix4, trunkRadius: number) {
  const at = (pos: Vec3, rot: [number, number, number] = [0, 0, 0]) => m.clone().multiply(place(pos, rot))
  p.add(COLORS.camo, new THREE.BoxGeometry(0.1, 0.22, 0.15), at([0.05, 0, 0]))
  p.add(COLORS.camoDark, new THREE.BoxGeometry(0.03, 0.05, 0.16), at([0.09, 0.08, 0])) // sensor strip
  p.add(COLORS.lens, new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), at([0.11, 0.01, 0], [0, 0, Math.PI / 2]))
  // Strap around the trunk (a thin flat ring).
  p.add(COLORS.strap, new THREE.TorusGeometry(trunkRadius + 0.01, 0.012, 3, 12), at([-trunkRadius, 0, 0], [Math.PI / 2, 0, 0]))
}

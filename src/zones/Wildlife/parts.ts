import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { heightAt } from '../../scene/islandShape'
import type { Vec3 } from '../../scene/layout'
import type { Model } from '../../scene/models'

// Colours, helpers and the trail camera. The trees, rocks, flowers and the log are models
// from the kit (src/scene/models.ts), added with model().
// Zone coordinates: `origin` is the zone's position on the ground, +x is east, +z is south.
// The animals are in animals.ts.

export const COLORS = {
  white: '#fbf6ea',
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

// A model from the kit, added like any other piece: `m` places, turns and scales it.
// Its shapes are copied, because Pieces.add uses up what it's given.
export function model(p: Pieces, { parts }: Model, m: THREE.Matrix4) {
  for (const { color, geometry } of parts) p.add(color, geometry.clone(), m)
}

// How thick a model is at height y (m, at scale 1): a horizontal cut through it at that
// height, and the farthest point of the cut from the model's middle line. For a tree low
// down, that's its trunk. The cut points are where the triangles' edges cross height y.
export function trunkRadius({ parts }: Model, y: number) {
  let radius = 0
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  for (const { geometry } of parts) {
    const pos = geometry.getAttribute('position')
    const index = geometry.index
    const triangles = (index ? index.count : pos.count) / 3
    const corner = (t: number, k: number) => (index ? index.getX(t * 3 + k) : t * 3 + k)
    for (let t = 0; t < triangles; t++) {
      for (let k = 0; k < 3; k++) {
        a.fromBufferAttribute(pos, corner(t, k))
        b.fromBufferAttribute(pos, corner(t, (k + 1) % 3))
        if ((a.y - y) * (b.y - y) > 0 || a.y === b.y) continue // this edge doesn't cross y
        a.lerp(b, (y - a.y) / (b.y - a.y))
        radius = Math.max(radius, Math.hypot(a.x, a.z))
      }
    }
  }
  return radius
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

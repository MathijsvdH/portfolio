import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { heightAt } from '../../scene/islandShape'
import type { Vec3 } from '../../scene/layout'

// Colours, shape builders and helpers for the reef. Zone coordinates: `origin` is the
// zone's position (at sea level), +x is east, +z is south, y = 0 is the water surface.

export const COLORS = {
  // Strong colours on purpose: the water on top makes everything paler.
  pink: '#ff3d86',
  red: '#e8303a',
  orange: '#ff7a1a',
  yellow: '#ffc21a',
  purple: '#7a3fe0',
  lilac: '#c15ae8',
  teal: '#14a88a',
  seagrass: '#3f8a3a',
  rock: '#8f877b',
  star: '#ff8a3a',
  wood: '#c8955a',
  woodDark: '#8a5f36',
  barrel: '#2f5d8c',
  flag: '#d8342c',
  white: '#fbf6ea',
  metal: '#9aa3a8',
  tank: '#f2c230',
}

// Ground height at a spot in zone coordinates (negative = under water).
export function groundY(origin: Vec3, x: number, z: number) {
  return heightAt(origin[0] + x, origin[2] + z) - origin[1]
}

// A random number generator that gives the same numbers every time for the same seed,
// so the reef looks the same on every visit.
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

const UP = new THREE.Vector3(0, 1, 0)

// Position, rotation (radians) and scale in one matrix.
export function place(pos: THREE.Vector3, rot: [number, number, number] = [0, 0, 0], scale: number | Vec3 = 1) {
  const s = typeof scale === 'number' ? new THREE.Vector3(scale, scale, scale) : new THREE.Vector3(...scale)
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot))
  return new THREE.Matrix4().compose(pos, q, s)
}

// A cylinder from point a to point b.
export function stick(a: THREE.Vector3, b: THREE.Vector3, radius: number, tipRadius = radius, sides = 6) {
  const dir = b.clone().sub(a)
  const g = new THREE.CylinderGeometry(tipRadius, radius, dir.length(), sides)
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().lerp(b, 0.5), q, new THREE.Vector3(1, 1, 1)))
  return g
}

// Material kinds a piece can use: plain, seen from both sides, or the see-through sea fan.
export type Kind = 'solid' | 'double' | 'fan'

// Collects many small pieces, sorted by colour, and glues each colour into one geometry
// ("merging"). The whole reef then draws as a handful of meshes instead of hundreds,
// which keeps it fast.
export class Pieces {
  private groups = new Map<string, THREE.BufferGeometry[]>()

  add(kind: Kind, color: string, g: THREE.BufferGeometry, m: THREE.Matrix4) {
    // Merging needs every piece in the same format, so turn shared corners into separate ones.
    const piece = g.index ? g.toNonIndexed() : g.clone()
    piece.applyMatrix4(m)
    const key = `${kind}|${color}`
    const list = this.groups.get(key) ?? []
    list.push(piece)
    this.groups.set(key, list)
    g.dispose()
  }

  build() {
    return [...this.groups].map(([key, list]) => {
      const [kind, color] = key.split('|') as [Kind, string]
      return { key, kind, color, geometry: mergeGeometries(list) }
    })
  }
}

// ---------- coral shapes ----------
// Each one stands on the seabed at y = 0 and is about 1 m tall at scale 1;
// `m` places, turns and scales it.

type Rand = () => number

// Brain coral: a squashed, half-buried lumpy ball.
export function brainCoral(p: Pieces, color: string, m: THREE.Matrix4) {
  const g = new THREE.IcosahedronGeometry(0.75, 1)
  g.scale(1, 0.75, 1)
  p.add('solid', color, g, m.clone().multiply(place(new THREE.Vector3(0, 0.15, 0))))
}

// Branching (staghorn) coral: a stem that splits again and again, with round tips.
export function branchingCoral(p: Pieces, color: string, m: THREE.Matrix4, rand: Rand) {
  function grow(start: THREE.Vector3, dir: THREE.Vector3, len: number, radius: number, level: number) {
    const end = start.clone().addScaledVector(dir, len)
    p.add('solid', color, stick(start, end, radius, radius * 0.75, 5), m)
    if (level === 0) {
      p.add('solid', color, new THREE.IcosahedronGeometry(radius * 0.9, 0), m.clone().multiply(place(end)))
      return
    }
    const kids = 2 + Math.floor(rand() * 2)
    for (let i = 0; i < kids; i++) {
      // Lean away from the parent at a random angle, but keep reaching upwards.
      const a = rand() * Math.PI * 2
      const next = dir
        .clone()
        .add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.6 + rand() * 0.4))
        .add(new THREE.Vector3(0, 0.3, 0))
        .normalize()
      grow(end, next, len * (0.65 + rand() * 0.15), radius * 0.72, level - 1)
    }
  }
  grow(new THREE.Vector3(0, -0.05, 0), UP.clone(), 0.38, 0.09, 2)
}

// Table coral: a flat plate on a short stalk.
export function tableCoral(p: Pieces, color: string, m: THREE.Matrix4) {
  p.add('solid', color, new THREE.CylinderGeometry(0.1, 0.16, 0.6, 6), m.clone().multiply(place(new THREE.Vector3(0, 0.3, 0))))
  p.add('solid', color, new THREE.CylinderGeometry(0.85, 0.7, 0.12, 10), m.clone().multiply(place(new THREE.Vector3(0, 0.66, 0))))
}

// Tube sponges: a cluster of open tubes, leaning a little outwards.
export function tubeSponges(p: Pieces, color: string, m: THREE.Matrix4, rand: Rand) {
  const count = 4 + Math.floor(rand() * 3)
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand() * 0.6
    const d = i === 0 ? 0 : 0.18 + rand() * 0.12
    const h = 0.45 + rand() * 0.5
    const r = 0.08 + rand() * 0.05
    const tilt = d * 0.9
    p.add(
      'double',
      color,
      new THREE.CylinderGeometry(r, r * 0.75, h, 8, 1, true),
      m.clone().multiply(place(new THREE.Vector3(Math.cos(a) * d, h / 2 - 0.05, Math.sin(a) * d), [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt])),
    )
  }
}

// Sea fan: a flat half-circle of lattice on a short stem.
export function seaFan(p: Pieces, color: string, m: THREE.Matrix4) {
  p.add('fan', color, new THREE.CircleGeometry(0.6, 16, 0, Math.PI), m.clone().multiply(place(new THREE.Vector3(0, 0.25, 0), [0, 0, 0], [1, 1.25, 1])))
  p.add('solid', color, new THREE.CylinderGeometry(0.03, 0.05, 0.3, 5), m.clone().multiply(place(new THREE.Vector3(0, 0.12, 0))))
}

// Sea grass: a tuft of thin blades.
export function seaGrass(p: Pieces, m: THREE.Matrix4, rand: Rand) {
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const d = rand() * 0.3
    const h = 0.4 + rand() * 0.6
    p.add(
      'solid',
      COLORS.seagrass,
      new THREE.ConeGeometry(0.035, h, 3),
      m.clone().multiply(place(new THREE.Vector3(Math.cos(a) * d, h / 2, Math.sin(a) * d), [(rand() - 0.5) * 0.4, 0, (rand() - 0.5) * 0.4])),
    )
  }
}

// Starfish: a flat five-pointed star lying on the sand.
export function starfish(p: Pieces, m: THREE.Matrix4) {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.08 : 0.22
    const a = (i / 10) * Math.PI * 2
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false })
  g.rotateX(-Math.PI / 2) // lay it flat
  p.add('solid', COLORS.star, g, m)
}

// A lumpy rock. Low detail on purpose: the flat faces give the low-poly look.
export function rock(p: Pieces, m: THREE.Matrix4) {
  p.add('solid', COLORS.rock, new THREE.IcosahedronGeometry(1, 0), m)
}

// ---------- textures ----------

let fanTexture: THREE.CanvasTexture | null = null

// A lattice pattern for the sea fans, drawn once on a small canvas. Transparent
// pixels are cut away (alphaTest), so you can see through the gaps.
export function fanLattice() {
  if (fanTexture) return fanTexture
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(size, size)
  ctx.moveTo(size, 0)
  ctx.lineTo(0, size)
  ctx.stroke()
  fanTexture = new THREE.CanvasTexture(canvas)
  fanTexture.wrapS = fanTexture.wrapT = THREE.RepeatWrapping
  fanTexture.repeat.set(7, 7)
  return fanTexture
}

import * as THREE from 'three'
import { heightAt } from '../../scene/islandShape'
import type { Vec3 } from '../../scene/layout'

// Sizes, spots and shape helpers shared by the parts of the Boat zone.
// Zone coordinates: x runs along the jetty out to sea (east), +z is south,
// y = 0 is sea level. Everything is life-size (1 unit = 1 m).

export const JETTY_LENGTH = 20
export const JETTY_WIDTH = 2.4
export const DECK_HEIGHT = 1.3 // top of the jetty planks above the water

// The sailboat, moored on the south side of the jetty, bow out to sea.
export const BOAT_POS: Vec3 = [13, 0, 3.4]
export const BOAT_DECK = 1.02 // top of the boat's deck, in boat coordinates

// Bollards on the jetty that the mooring lines are tied to.
export const BOLLARDS: Vec3[] = [
  [7.5, DECK_HEIGHT, 0.85],
  [12.5, DECK_HEIGHT, 0.85],
  [18.8, DECK_HEIGHT, 0.85],
]

export const COLORS = {
  wood: '#b0835a',
  woodDark: '#7a5838',
  hull: '#f7f4ee',
  hullLow: '#2f5d8c',
  deck: '#c99a68',
  roof: '#d9543f',
  window: '#5aa8d8',
  sail: '#fbf6ea',
  mast: '#e8e2d4',
  rope: '#e8d6a8',
  metal: '#555555',
  net: '#3f7f5a',
  netDark: '#2c5c41',
  float: '#f28a2e',
  floatWhite: '#f4f1ea',
  crate: '#c4925a',
}

// Ground height under a spot in zone coordinates (origin = the zone's position).
export function groundY(origin: Vec3, x: number, z: number) {
  return heightAt(origin[0] + x, origin[2] + z) - origin[1]
}

export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

// ---------- the boat's shape ----------

const STERN = -4.2
const BOW = 4.8

// Half the deck's width at a spot along the boat: widest just behind the middle,
// narrowing to a point at the bow and a little towards the flat stern.
export function halfWidth(x: number) {
  if (x < -0.5) return 1.55 * (1 - 0.25 * ((x + 0.5) / 3.7) ** 2)
  return 1.55 * (1 - ((x + 0.5) / 5.3) ** 2)
}

// Top-view outline of the deck (~9 m long, ~3.1 m wide), traced from halfWidth.
export function hullShape() {
  const shape = new THREE.Shape()
  const steps = 24
  shape.moveTo(STERN, -halfWidth(STERN))
  for (let i = 1; i <= steps; i++) {
    const x = STERN + ((BOW - STERN) * i) / steps
    shape.lineTo(x, -halfWidth(x))
  }
  for (let i = steps - 1; i >= 0; i--) {
    const x = STERN + ((BOW - STERN) * i) / steps
    shape.lineTo(x, halfWidth(x))
  }
  shape.closePath()
  return shape
}

// The outline pushed up into a solid (ExtrudeGeometry), with rounded edges (bevel).
// Extrusion goes along z, so rotate it to point up.
export function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 16,
  })
  g.rotateX(-Math.PI / 2)
  return g
}

// A sail: a triangle (tack = front bottom, head = top, clew = back bottom) in the
// boat's centre plane, built as a grid so it can bulge out to the side (+z) like it
// catches wind. `camber` is how far it bulges, in metres.
export function sailGeometry(tack: THREE.Vector2, head: THREE.Vector2, clew: THREE.Vector2, camber: number) {
  const rows = 10
  const cols = 8
  const positions: number[] = []
  const index: number[] = []
  for (let r = 0; r <= rows; r++) {
    const v = r / rows // 0 at the foot, 1 at the head
    const luff = tack.clone().lerp(head, v)
    const leech = clew.clone().lerp(head, v)
    for (let c = 0; c <= cols; c++) {
      const u = c / cols // 0 at the front edge, 1 at the back edge
      const p = luff.clone().lerp(leech, u)
      positions.push(p.x, p.y, camber * (1 - v) * Math.sin(Math.PI * u))
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c
      const b = a + cols + 1
      index.push(a, a + 1, b, a + 1, b + 1, b)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

// ---------- rope ----------

const ROPE_RADIUS = 0.03

// A rope (a thin tube) from a to b, hanging `sag` metres lower in the middle.
export function rope(a: THREE.Vector3, b: THREE.Vector3, sag = 0, radius = ROPE_RADIUS) {
  const mid = a.clone().lerp(b, 0.5)
  mid.y -= sag * 2 // a curve only reaches halfway to its control point
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
  return new THREE.TubeGeometry(curve, sag > 0 ? 12 : 1, radius, 5)
}

// A rope through several points, straight between them (rigging, railings).
// Tension 0 makes the curve run straight from point to point.
export function ropeThrough(points: THREE.Vector3[], radius = ROPE_RADIUS) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0)
  return new THREE.TubeGeometry(curve, points.length * 6, radius, 5)
}

// ---------- fishing nets ----------

const NET_CELL = 0.3 // metres per mesh hole

// A small see-through diamond-mesh pattern, drawn once on a canvas.
// White lines; the material's colour tints them.
let netTex: THREE.CanvasTexture | null = null
export function netTexture() {
  if (netTex) return netTex
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(64, 64)
  ctx.moveTo(64, 0)
  ctx.lineTo(0, 64)
  ctx.stroke()
  netTex = new THREE.CanvasTexture(canvas)
  netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping
  return netTex
}

// Stretch a geometry's texture coordinates so one net hole is NET_CELL metres.
export function netUv(g: THREE.BufferGeometry, widthM: number, heightM: number) {
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * widthM) / NET_CELL, (uv.getY(i) * heightM) / NET_CELL)
  return g
}

// A net hanging from a sagging line: top edge at y = 0, hanging down, billowing a little.
export function hangingNet(width: number, height: number, sag: number) {
  const g = new THREE.PlaneGeometry(width, height, 16, 8)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / width + 0.5 // 0..1 from side to side
    const t = 0.5 - pos.getY(i) / height // 0 at the top, 1 at the bottom
    const drop = sag * Math.sin(Math.PI * u)
    pos.setY(i, -t * height - drop)
    pos.setZ(i, t * (0.18 * Math.sin(Math.PI * u) + 0.06 * Math.sin(u * 11)))
  }
  netUv(g, width, height)
  g.computeVertexNormals()
  return g
}

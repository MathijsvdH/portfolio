// The island's landscape as plain math (no three.js): heightAt(x, z) gives the
// ground height in metres at any spot. Island.tsx turns it into a mesh, and
// other code uses it to put things exactly on the ground.
// Real scale: 1 unit = 1 metre. Sea level is y = 0.
// Angles are in the xz-plane: 0 = east (+x), PI/2 = south (+z), PI = west, 3PI/2 = north.

export type XZ = [number, number]

// ---------- noise ----------
// "Value noise": random heights on a 1 m grid, smoothly blended in between.
// Layering it at several sizes ("fbm") gives natural-looking bumps.

function hash(ix: number, iz: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function noise(x: number, z: number) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const u = fx * fx * (3 - 2 * fx)
  const v = fz * fz * (3 - 2 * fz)
  const a = hash(ix, iz)
  const b = hash(ix + 1, iz)
  const c = hash(ix, iz + 1)
  const d = hash(ix + 1, iz + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// Several layers of noise, each half the size and half as strong. Result 0..1.
function fbm(x: number, z: number, octaves = 4) {
  let sum = 0
  let amp = 0.5
  let total = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x, z)
    total += amp
    x *= 2.03
    z *= 2.03
    amp *= 0.5
  }
  return sum / total
}

// Like fbm but with sharp creases: good for mountain ridges. Result 0..1.
function ridged(x: number, z: number) {
  let sum = 0
  let amp = 0.5
  let total = 0
  for (let i = 0; i < 4; i++) {
    sum += amp * (1 - Math.abs(2 * noise(x, z) - 1)) ** 2
    total += amp
    x *= 2.1
    z *= 2.1
    amp *= 0.5
  }
  return sum / total
}

// ---------- helpers ----------

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// 1 in direction `center` (radians), fading to 0 a quarter turn away.
function bump(angle: number, center: number) {
  return Math.max(0, Math.cos(angle - center)) ** 2
}

// ---------- the island ----------

const EAST = 0
const SOUTH_EAST = Math.PI / 4
const SOUTH = Math.PI / 2
const WEST = Math.PI
const NORTH = (3 * Math.PI) / 2

// Distance from the centre to the coast, per direction.
function coastRadius(a: number) {
  const base = 110 * (1 + 0.06 * Math.sin(2 * a + 0.5) + 0.05 * Math.sin(3 * a + 1.7) + 0.03 * Math.sin(5 * a + 4.1))
  const cove = 34 * bump(a, SOUTH_EAST) ** 4 // bay for the reef lagoon
  const headland = 20 * bump(a, WEST) ** 3 // west point for the robot workshop
  return base - cove + headland
}

// Metres of sand before the land rises: real beaches south and east, thin elsewhere.
function beachWidth(a: number) {
  return 4 + 14 * bump(a, SOUTH) ** 2 + 10 * bump(a, EAST) ** 2
}

// Over how many metres the land climbs from the beach to the lowlands:
// slow and gentle in the south and east, short (cliffs) elsewhere.
function riseLength(a: number) {
  return 12 + 30 * bump(a, SOUTH) ** 2 + 25 * bump(a, EAST) ** 2
}

// How high the lowlands get. Higher in the north and west, which with a thin
// beach gives steep, rocky sea cliffs there.
function lowlandHeight(a: number) {
  return 4 + 9 * bump(a, NORTH) ** 2 + 4 * bump(a, WEST) ** 2
}

type Peak = { center: XZ; radius: number; height: number }

export const MOUNTAIN: Peak = { center: [0, -8], radius: 70, height: 85 }
// A lower shoulder to the north-east so the silhouette isn't one perfect cone.
const SHOULDER: Peak = { center: [36, -34], radius: 40, height: 30 }

function peakHeight(x: number, z: number, p: Peak) {
  const dx = x - p.center[0]
  const dz = z - p.center[1]
  const a = Math.atan2(dz, dx)
  const r = p.radius * (1 + 0.12 * Math.sin(3 * a + 2) + 0.08 * Math.sin(5 * a + 1))
  const t = Math.hypot(dx, dz) / r
  if (t >= 1) return 0
  const cone = (1 - t) ** 1.5 // steep near the top, gentle at the foot
  const rocks = 0.75 + 0.45 * ridged(x / 32 + 11, z / 32 - 5) // ridges and gullies
  return p.height * cone * rocks
}

// Ground height (y, metres) at a spot. Below 0 is under water.
export function heightAt(x: number, z: number) {
  const a = Math.atan2(z, x)
  // Noise on the distance makes the coastline wobbly instead of a smooth curve.
  const d = Math.hypot(x, z) + 14 * (fbm(x / 45 + 3, z / 45 - 7) - 0.5)
  const inland = coastRadius(a) - d // metres from the coast; negative = out at sea

  let h: number
  if (inland < 0) {
    // Sea floor: drops away from the coast, but stays shallow in the south-east lagoon.
    const drop = 0.35 - 0.3 * bump(a, SOUTH_EAST) ** 3
    h = Math.max(-12, -0.6 + inland * drop)
  } else {
    const bw = beachWidth(a)
    const beach = -0.6 + 2.6 * smoothstep(0, bw, inland) // sand up to ~2 m
    const rise = smoothstep(bw * 0.8, bw + riseLength(a), inland) // where the land starts to climb
    const plain = lowlandHeight(a) + 6 * fbm(x / 50, z / 50) // rolling lowlands
    h = beach + rise * plain
  }

  return h + peakHeight(x, z, MOUNTAIN) + peakHeight(x, z, SHOULDER)
}

// How far a square of `size` metres around a spot goes up and down. Small = flat
// enough to build on.
export function bumpiness(x: number, z: number, size = 10) {
  const s = size / 2
  const hs = [heightAt(x - s, z - s), heightAt(x + s, z - s), heightAt(x - s, z + s), heightAt(x + s, z + s), heightAt(x, z)]
  return Math.max(...hs) - Math.min(...hs)
}

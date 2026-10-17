import * as THREE from 'three'
import type { Vec3 } from '../../scene/layout'
import { COLORS, Pieces, place, stick } from './parts'

// Life-size animals from simple shapes. Each one stands on the ground at y = 0 and faces
// +x. MeadowAnimals.tsx places them and makes them move. Sizes are real: a red deer stag is
// about 1.3 m at the shoulder, a fox about 40 cm.

// A body lying along x: a capsule (a cylinder with round ends).
function body(radius: number, length: number) {
  const g = new THREE.CapsuleGeometry(radius, length, 2, 7)
  g.rotateZ(Math.PI / 2)
  return g
}

// Four legs under a body, from the hips/shoulders straight down to the ground.
function legs(p: Pieces, color: string, m: THREE.Matrix4, front: number, back: number, width: number, top: number, radius: number) {
  for (const x of [front, back]) {
    for (const z of [-width, width]) p.add(color, stick([x, top, z], [x, 0, z], radius, radius * 0.6, 5), m)
  }
}

// Deer: a stag with antlers, or a doe without, in three parts that can move (MeadowAnimals.tsx):
//   body  the body and legs, standing on y = 0
//   neck  turns around NECK_BASE; built with the head up
//   head  turns around the top of the neck; built level, MeadowAnimals.tsx tilts it (HEAD_TILT)
export const NECK_BASE: Vec3 = [0.5, 1.15, 0]
export const NECK: Vec3 = [0.32, 0.57, 0] // from the base to the top of the neck, head up
export const HEAD_TILT = -0.35 // nose down a little, when the head is up

export type DeerParts = { body: Pieces; neck: Pieces; head: Pieces }

export function deer({ body: b, neck, head }: DeerParts, antlers: boolean) {
  const I = new THREE.Matrix4()
  b.add(COLORS.deer, body(0.3, 1.0), place([0, 1.08, 0]))
  b.add(COLORS.deerLight, new THREE.IcosahedronGeometry(0.22, 0), place([-0.68, 1.1, 0], [0, 0, 0], [0.5, 1, 1])) // pale rump
  legs(b, COLORS.deer, I, 0.48, -0.5, 0.15, 1.0, 0.07)

  neck.add(COLORS.deer, stick([0, 0, 0], NECK, 0.16, 0.1, 6), I)

  const box = (pos: Vec3, s: Vec3, color = COLORS.deer) => head.add(color, new THREE.BoxGeometry(...s), place(pos))
  box([0.1, 0.02, 0], [0.32, 0.2, 0.2])
  box([0.3, -0.02, 0], [0.14, 0.13, 0.14]) // snout
  box([0.38, -0.01, 0], [0.03, 0.08, 0.1], COLORS.dark) // nose
  for (const z of [-0.12, 0.12]) {
    head.add(COLORS.deer, new THREE.ConeGeometry(0.05, 0.2, 4), place([-0.02, 0.14, z], [z > 0 ? 0.7 : -0.7, 0, 0])) // ears
  }

  if (antlers) {
    // Each antler: a main beam curving up and back, with three points (tines) off it.
    for (const side of [-1, 1]) {
      const pts: Vec3[] = [
        [0.0, 0.1, side * 0.06],
        [-0.08, 0.42, side * 0.22],
        [-0.2, 0.75, side * 0.3],
        [-0.28, 0.95, side * 0.24],
      ]
      for (let i = 0; i < pts.length - 1; i++) head.add(COLORS.antler, stick(pts[i], pts[i + 1], 0.035 - i * 0.007, 0.03 - i * 0.007, 4), I)
      for (const [from, to] of [
        [pts[1], [0.14, 0.52, side * 0.24]],
        [pts[2], [0.02, 0.92, side * 0.4]],
        [pts[2], [-0.4, 0.85, side * 0.34]],
      ] as [Vec3, Vec3][]) {
        head.add(COLORS.antler, stick(from, to, 0.022, 0.012, 4), I)
      }
    }
  }
}

// Fox: orange with a white chest, dark legs and a big bushy tail with a white tip. The tail
// is built separately, around TAIL_BASE, so it can swish (MeadowAnimals.tsx).
export const TAIL_BASE: Vec3 = [-0.3, 0.33, 0]

export function fox(p: Pieces, tail: Pieces) {
  const m = new THREE.Matrix4()
  const at = (pos: Vec3, rot: [number, number, number] = [0, 0, 0], s: number | Vec3 = 1) => m.clone().multiply(place(pos, rot, s))
  p.add(COLORS.fox, body(0.12, 0.42), at([0, 0.36, 0]))
  legs(p, COLORS.dark, m, 0.2, -0.2, 0.06, 0.32, 0.028)
  p.add(COLORS.white, new THREE.IcosahedronGeometry(0.09, 0), at([0.3, 0.38, 0], [0, 0, 0], [0.8, 1, 0.9])) // chest
  p.add(COLORS.fox, new THREE.IcosahedronGeometry(0.1, 0), at([0.36, 0.5, 0], [0, 0, 0], [1.1, 0.9, 1])) // head
  const snout = new THREE.ConeGeometry(0.055, 0.18, 5)
  snout.rotateZ(-Math.PI / 2)
  p.add(COLORS.fox, snout, at([0.5, 0.47, 0]))
  p.add(COLORS.dark, new THREE.IcosahedronGeometry(0.02, 0), at([0.59, 0.47, 0])) // nose
  for (const z of [-0.05, 0.05]) p.add(COLORS.fox, new THREE.ConeGeometry(0.035, 0.11, 4), at([0.33, 0.62, z], [z > 0 ? 0.25 : -0.25, 0, 0]))
  // Tail: a long cone from the rump, hanging low, with a white tip. Relative to TAIL_BASE.
  tail.add(COLORS.fox, new THREE.ConeGeometry(0.1, 0.5, 6), place([-0.18, -0.05, 0], [0, 0, 1.8]))
  tail.add(COLORS.white, new THREE.IcosahedronGeometry(0.055, 0), place([-0.44, -0.13, 0]))
}

// Rabbit, sitting up: round body, long ears and a white tail puff.
export function rabbit(p: Pieces) {
  const m = new THREE.Matrix4()
  const at = (pos: Vec3, rot: [number, number, number] = [0, 0, 0], s: number | Vec3 = 1) => m.clone().multiply(place(pos, rot, s))
  p.add(COLORS.rabbit, new THREE.IcosahedronGeometry(0.13, 1), at([0, 0.13, 0], [0, 0, 0.3], [1.3, 1, 1]))
  p.add(COLORS.rabbit, new THREE.IcosahedronGeometry(0.075, 0), at([0.13, 0.26, 0]))
  for (const z of [-0.03, 0.03]) p.add(COLORS.rabbit, new THREE.BoxGeometry(0.03, 0.16, 0.05), at([0.1, 0.38, z], [z > 0 ? 0.15 : -0.15, 0, 0.25]))
  p.add(COLORS.white, new THREE.IcosahedronGeometry(0.04, 0), at([-0.17, 0.12, 0]))
}

// Hedgehog: a low dome of dark spines with a pale pointy face.
export function hedgehog(p: Pieces) {
  const m = new THREE.Matrix4()
  const at = (pos: Vec3, rot: [number, number, number] = [0, 0, 0], s: number | Vec3 = 1) => m.clone().multiply(place(pos, rot, s))
  p.add(COLORS.hedgehog, new THREE.IcosahedronGeometry(0.13, 0), at([0, 0.08, 0], [0, 0, 0], [1.3, 0.75, 1]))
  const face = new THREE.ConeGeometry(0.06, 0.13, 5)
  face.rotateZ(-Math.PI / 2)
  p.add(COLORS.hedgehogFace, face, at([0.18, 0.06, 0]))
  p.add(COLORS.dark, new THREE.IcosahedronGeometry(0.015, 0), at([0.25, 0.06, 0]))
}

// Robin: a small brown bird with an orange breast, perched (its feet at y = 0).
export function robin(p: Pieces) {
  const m = new THREE.Matrix4()
  const at = (pos: Vec3, rot: [number, number, number] = [0, 0, 0], s: number | Vec3 = 1) => m.clone().multiply(place(pos, rot, s))
  p.add(COLORS.robin, new THREE.IcosahedronGeometry(0.06, 0), at([0, 0.07, 0], [0, 0, 0], [1.2, 1, 0.9]))
  p.add(COLORS.robinBreast, new THREE.IcosahedronGeometry(0.045, 0), at([0.035, 0.065, 0]))
  p.add(COLORS.robin, new THREE.IcosahedronGeometry(0.04, 0), at([0.05, 0.13, 0]))
  const beak = new THREE.ConeGeometry(0.012, 0.035, 4)
  beak.rotateZ(-Math.PI / 2)
  p.add(COLORS.dark, beak, at([0.1, 0.13, 0]))
  p.add(COLORS.robin, new THREE.BoxGeometry(0.08, 0.012, 0.04), at([-0.09, 0.08, 0], [0, 0, 0.4])) // tail
}

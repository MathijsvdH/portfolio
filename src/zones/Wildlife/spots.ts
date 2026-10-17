import type { Vec3 } from '../../scene/layout'

// Where the animals and the fallen log are in the meadow. Zone coordinates (see
// Wildlife.tsx). Used by the meadow (the log, the trail camera's aim) and MeadowAnimals.tsx.

// [x, z, turn]. Turn is in radians: 0 faces east, PI / 2 faces north.
export const STAG: Vec3 = [-4, -3, 0.5]
export const DOE: Vec3 = [-0.5, 0.5, 2.7]
export const FOX: Vec3 = [9, -4, 2.3]
export const RABBITS: Vec3[] = [
  [-12, -6, 1.2],
  [-10.8, -5.4, 2.6],
  [4, -8, -0.4],
]
export const LOG: Vec3 = [-15, 2, 0.35] // a fallen tree
export const LOG_SIZE = { length: 4.5, height: 0.72 } // the robins sit on top
export const HEDGEHOG: Vec3 = [-12.6, 3.6, -0.6]
// The two robins on the log: how far along it (m from its middle) and which way they look
// (radians, added to the log's turn).
export const ROBINS: [number, number][] = [
  [0.6, 0.4],
  [-1.3, 2.6],
]

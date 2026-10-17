import type { Vec3 } from '../../scene/layout'
import { reach, type ArmPose } from './armPose'

// The arms' task, as a function of time: pick up the block, carry it to the tray, put it
// in, then the scene resets for the next try. Some tries the block slips out of the
// fingers on the way and drops onto the table. Both arms have the same task and the same
// odds; they just run out of step. (The scene doesn't claim which method works better.)
//
// Everything is worked out from the time alone, so the arm (RobotArm.tsx) and its block
// (TaskBlock in RobotCorner.tsx) can each ask "where am I now?" and always agree.
// Arm coordinates: the arm's base at (0, 0, 0) on the table top.

const BLOCK = 0.06 // block size (the same as BLOCK in parts.ts)
const LIFT = 0.16 // fingertip height when carrying
const GRAB = 0.012 // fingertip height when holding a block that stands on the table
const OPEN = 0.1 // gap between the fingers when open
const GRIP = 0.05 // gap when holding a block: a little less than the block
const HELD = 0.02 // a held block's middle is this far above the fingertips
const FAIL_ODDS = 0.3 // how often a try fails
const CYCLE = 9 // seconds per try

export type Station = { pick: Vec3; tray: Vec3 } // where the block starts, where it goes (fingertips, on the table/tray floor)
export type BlockState = { position: Vec3; turn: number; tilt: number; scale: number }
type Key = { at: number; target: Vec3; open: number }

// The arm's moves in one try: at `at` seconds the fingertips are at `target`, the fingers
// `open` this far. In between it moves smoothly from one key to the next.
function keys({ pick, tray }: Station): Key[] {
  const above = (p: Vec3): Vec3 => [p[0], LIFT, p[2]]
  const at = (p: Vec3, y: number): Vec3 => [p[0], y, p[2]]
  return [
    { at: 0, target: above(pick), open: OPEN },
    { at: 1, target: at(pick, GRAB), open: OPEN }, // down to the block
    { at: 1.5, target: at(pick, GRAB), open: GRIP }, // close the fingers
    { at: 2.4, target: above(pick), open: GRIP }, // lift
    { at: 4, target: above(tray), open: GRIP }, // carry
    { at: 4.8, target: at(tray, tray[1] + GRAB), open: GRIP }, // lower into the tray
    { at: 5.3, target: at(tray, tray[1] + GRAB), open: OPEN }, // let go
    { at: 6.1, target: above(tray), open: OPEN },
    { at: 7.5, target: above(pick), open: OPEN }, // back, then wait for the next block
    { at: CYCLE, target: above(pick), open: OPEN },
  ]
}

const smooth = (t: number) => t * t * (3 - 2 * t) // eases in and out

// Fingertip target and finger gap at time t (seconds into the try).
function follow(list: Key[], t: number): { target: Vec3; open: number } {
  const i = Math.max(0, list.findIndex((k) => k.at > t) - 1)
  const a = list[i]!
  const b = list[i + 1] ?? a
  const f = b.at > a.at ? smooth(Math.min(1, (t - a.at) / (b.at - a.at))) : 0
  const lerp = (u: number, v: number) => u + (v - u) * f
  return {
    target: [lerp(a.target[0], b.target[0]), lerp(a.target[1], b.target[1]), lerp(a.target[2], b.target[2])],
    open: lerp(a.open, b.open),
  }
}

// A random number 0..1 for try number n, the same every time.
function chance(n: number, seed: number) {
  const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export type TaskState = { pose: ArmPose; block: BlockState }

export function taskAt(station: Station, time: number, seed: number): TaskState {
  const list = keys(station)
  const shifted = time + seed * 3.7 // each arm starts at a different point
  const n = Math.floor(shifted / CYCLE) // which try
  const t = shifted - n * CYCLE // seconds into this try
  const fails = chance(n, seed) < FAIL_ODDS
  const slipAt = 2.7 + chance(n, seed + 1) * 1.2 // when it slips, during the carry

  let { target, open } = follow(list, t)
  // When it slips the fingers spring open a little.
  if (fails && t > slipAt && t < 5.3) open = Math.max(open, GRIP + 0.025)
  const pose = reach(target, open)

  // The block. While it waits it's already turned the way the gripper will meet it.
  const hand = (p: Vec3): Vec3 => [p[0], p[1] + HELD, p[2]]
  const pickAt = follow(list, 1.5).target
  const waiting: BlockState = { position: hand(pickAt), turn: reach(pickAt, GRIP).turn, tilt: 0, scale: 1 }
  let block: BlockState
  if (t < 1.5) {
    block = waiting // (it grew in at the end of the last try)
  } else if (fails && t > slipAt) {
    // Falling: from where the hand was when it slipped, down to the table, landing tipped over.
    const from = hand(follow(list, slipAt).target)
    const fall = Math.min(1, (t - slipAt) / Math.sqrt((2 * (from[1] - BLOCK / 2)) / 9.8))
    const landed: Vec3 = [from[0] + 0.03, BLOCK / 2, from[2] + 0.02]
    block = {
      position: [from[0] + (landed[0] - from[0]) * fall, from[1] - (from[1] - landed[1]) * fall * fall, from[2] + (landed[2] - from[2]) * fall],
      turn: reach(follow(list, slipAt).target, GRIP).turn + fall * 0.6,
      tilt: fall * (Math.PI / 2),
      scale: shrink(t),
    }
  } else if (t < 5.3) {
    block = { position: hand(target), turn: pose.turn, tilt: 0, scale: 1 } // held
  } else {
    block = { position: hand(follow(list, 5.3).target), turn: reach(follow(list, 5.3).target, OPEN).turn, tilt: 0, scale: shrink(t) } // in the tray
  }
  // The new block for the next try grows in at the pick spot near the end of this one.
  if (t > CYCLE - 1.7 && block.scale === 0) {
    block = { ...waiting, scale: grow(t, CYCLE - 1.7, CYCLE - 0.7) }
  }
  return { pose, block }
}

// The reset between tries: the old block shrinks away, a new one grows in where the next
// pick-up is. A shortcut, so the loop can go on forever.
function shrink(t: number) {
  return 1 - smooth(Math.min(1, Math.max(0, (t - 6.5) / 0.8)))
}
function grow(t: number, from: number, to: number) {
  return smooth(Math.min(1, Math.max(0, (t - from) / (to - from))))
}

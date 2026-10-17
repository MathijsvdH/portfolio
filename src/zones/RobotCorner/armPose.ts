import type { Vec3 } from '../../scene/layout'

// The robot arm's sizes (metres) and the maths for posing it. Used by RobotArm.tsx.

export const BASE_HEIGHT = 0.16 // from the table to the shoulder joint
export const UPPER = 0.36 // shoulder to elbow
export const FORE = 0.32 // elbow to wrist
export const HAND = 0.14 // wrist to the middle of the fingertips

export type ArmPose = {
  turn: number // base, around y (radians, 0 = reaching towards +x)
  shoulder: number // the joints tilt each link forward, away from the base
  elbow: number
  wrist: number
  open: number // gap between the fingers, metres
}

// Inverse kinematics: which joint angles put the fingertips at `target` (in arm
// coordinates), with the gripper pointing straight down? Two links of known length and a
// known distance between their ends make a triangle, so its angles give the joints.
export function reach(target: Vec3, open: number): ArmPose {
  const [x, y, z] = target
  const turn = Math.atan2(-z, x)
  const across = Math.hypot(x, z)
  const up = y + HAND - BASE_HEIGHT // the wrist sits HAND above the fingertips
  const d = Math.min(Math.hypot(across, up), UPPER + FORE - 0.001)
  const toWrist = Math.atan2(across, up) // angle from straight up to the wrist
  const bend = Math.acos((UPPER ** 2 + d ** 2 - FORE ** 2) / (2 * UPPER * d))
  const shoulder = toWrist - bend // minus: elbow up
  const elbowX = Math.sin(shoulder) * UPPER
  const elbowY = Math.cos(shoulder) * UPPER
  const fore = Math.atan2(across - elbowX, up - elbowY) // forearm's angle from straight up
  return { turn, shoulder, elbow: fore - shoulder, wrist: Math.PI - fore, open }
}

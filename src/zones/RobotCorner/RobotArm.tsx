import type { Vec3 } from '../../scene/layout'
import { BASE_HEIGHT, FORE, HAND, UPPER, type ArmPose } from './armPose'
import { Paint } from './Paint'
import { BLOCK, COLORS } from './parts'

// A tabletop robot arm with a two-finger gripper, built as a chain of joints:
// base (turns around), shoulder, elbow, wrist, gripper.
//
// Each joint is a <group> inside the one before it, so turning a joint moves everything
// after it, like a real arm (a "scene graph" hierarchy). That's why the arm isn't merged
// like the rest of the workshop: later (step 15) the joints can be turned every frame.
//
// Arm coordinates: the base stands at y = 0, every link points up (+y) when its angle is 0.
// Sizes and the pose maths are in armPose.ts.

type Props = {
  position: Vec3
  rotation?: number // turns the whole arm around y
  pose: ArmPose
  accent: string // colour of the joint caps, one per test station
  holding?: string // colour of the block between the fingers, if any
  glow: number
}

export function RobotArm({ position, rotation = 0, pose, accent, holding, glow }: Props) {
  // In this model a positive angle tilts the link towards +x, which is rotation -angle
  // around z.
  const tilt = (a: number): [number, number, number] => [0, 0, -a]
  const paint = (color: string) => <Paint color={color} emissive={color} glow={glow} />
  const finger = Math.max(pose.open, BLOCK) / 2 + 0.008

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Fixed foot, screwed to the table. */}
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.05, 16]} />
        {paint(COLORS.tableLeg)}
      </mesh>

      {/* Base: turns around y. */}
      <group rotation={[0, pose.turn, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.1, 16]} />
          {paint(COLORS.white)}
        </mesh>

        {/* Shoulder */}
        <group position={[0, BASE_HEIGHT, 0]} rotation={tilt(pose.shoulder)}>
          <Joint radius={0.06} accent={accent} glow={glow} />
          <mesh position={[0, UPPER / 2, 0]} castShadow>
            <boxGeometry args={[0.07, UPPER, 0.07]} />
            {paint(COLORS.white)}
          </mesh>

          {/* Elbow */}
          <group position={[0, UPPER, 0]} rotation={tilt(pose.elbow)}>
            <Joint radius={0.05} accent={accent} glow={glow} />
            <mesh position={[0, FORE / 2, 0]} castShadow>
              <boxGeometry args={[0.055, FORE, 0.055]} />
              {paint(COLORS.white)}
            </mesh>

            {/* Wrist and gripper */}
            <group position={[0, FORE, 0]} rotation={tilt(pose.wrist)}>
              <Joint radius={0.035} accent={accent} glow={glow} />
              <mesh position={[0, 0.045, 0]} castShadow>
                <boxGeometry args={[0.05, 0.06, 0.1]} />
                {paint(COLORS.tool)}
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[0, HAND - 0.025, s * finger]} castShadow>
                  <boxGeometry args={[0.025, 0.07, 0.012]} />
                  {paint(COLORS.metal)}
                </mesh>
              ))}
              {holding && (
                <mesh position={[0, HAND - 0.02, 0]} castShadow>
                  <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
                  {paint(holding)}
                </mesh>
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

// A joint: a dark round hinge across the arm with coloured caps on both ends.
function Joint({ radius, accent, glow }: { radius: number; accent: string; glow: number }) {
  const width = radius * 1.9
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, width, 14]} />
        <Paint color={COLORS.tool} emissive={COLORS.tool} glow={glow} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, (s * width) / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.7, radius * 0.7, 0.01, 14]} />
          <Paint color={accent} emissive={accent} glow={glow} />
        </mesh>
      ))}
    </>
  )
}

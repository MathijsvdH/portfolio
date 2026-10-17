import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import type { Vec3 } from '../../scene/layout'
import { BASE_HEIGHT, FORE, HAND, UPPER, type ArmPose } from './armPose'
import { Paint } from './Paint'
import { BLOCK, COLORS } from './parts'

// A tabletop robot arm with a two-finger gripper, built as a chain of joints:
// base (turns around), shoulder, elbow, wrist, gripper.
//
// Each joint is a <group> inside the one before it, so turning a joint moves everything
// after it, like a real arm (a "scene graph" hierarchy). That's why the arm isn't merged
// like the rest of the workshop: every frame, useFrame asks `poseAt` for the pose at that
// moment and turns the joints to match, without re-rendering anything.
//
// Arm coordinates: the base stands at y = 0, every link points up (+y) when its angle is 0.
// Sizes and the pose maths are in armPose.ts.

type Props = {
  position: Vec3
  rotation?: number // turns the whole arm around y
  poseAt: (time: number) => ArmPose // the pose at a moment (seconds since the page opened)
  accent: string // colour of the joint caps, one per test station
  glow: number
}

export function RobotArm({ position, rotation = 0, poseAt, accent, glow }: Props) {
  const paint = (color: string) => <Paint color={color} emissive={color} glow={glow} />
  const base = useRef<THREE.Group>(null)
  const shoulder = useRef<THREE.Group>(null)
  const elbow = useRef<THREE.Group>(null)
  const wrist = useRef<THREE.Group>(null)
  const fingers = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    if (!base.current || !shoulder.current || !elbow.current || !wrist.current) return
    const pose = poseAt(clock.elapsedTime)
    // In this model a positive angle tilts the link towards +x, which is rotation -angle
    // around z.
    base.current.rotation.y = pose.turn
    shoulder.current.rotation.z = -pose.shoulder
    elbow.current.rotation.z = -pose.elbow
    wrist.current.rotation.z = -pose.wrist
    const finger = Math.max(pose.open, BLOCK) / 2 + 0.008
    fingers.current.forEach((mesh, i) => mesh?.position.setZ((i ? 1 : -1) * finger))
  })

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Fixed foot, screwed to the table. */}
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.05, 16]} />
        {paint(COLORS.tableLeg)}
      </mesh>

      {/* Base: turns around y. */}
      <group ref={base}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.1, 16]} />
          {paint(COLORS.white)}
        </mesh>

        {/* Shoulder */}
        <group ref={shoulder} position={[0, BASE_HEIGHT, 0]}>
          <Joint radius={0.06} accent={accent} glow={glow} />
          <mesh position={[0, UPPER / 2, 0]} castShadow>
            <boxGeometry args={[0.07, UPPER, 0.07]} />
            {paint(COLORS.white)}
          </mesh>

          {/* Elbow */}
          <group ref={elbow} position={[0, UPPER, 0]}>
            <Joint radius={0.05} accent={accent} glow={glow} />
            <mesh position={[0, FORE / 2, 0]} castShadow>
              <boxGeometry args={[0.055, FORE, 0.055]} />
              {paint(COLORS.white)}
            </mesh>

            {/* Wrist and gripper */}
            <group ref={wrist} position={[0, FORE, 0]}>
              <Joint radius={0.035} accent={accent} glow={glow} />
              <mesh position={[0, 0.045, 0]} castShadow>
                <boxGeometry args={[0.05, 0.06, 0.1]} />
                {paint(COLORS.tool)}
              </mesh>
              {[0, 1].map((i) => (
                <mesh key={i} ref={(mesh) => void (fingers.current[i] = mesh)} position={[0, HAND - 0.025, 0]} castShadow>
                  <boxGeometry args={[0.025, 0.07, 0.012]} />
                  {paint(COLORS.metal)}
                </mesh>
              ))}
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

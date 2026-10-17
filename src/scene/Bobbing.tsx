import { useRef, type ReactNode } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import type * as THREE from 'three'

type Props = ThreeElements['group'] & {
  height?: number // how far it rises and sinks (m)
  roll?: number // how far it rocks side to side, around x (radians)
  pitch?: number // how far it rocks front to back, around z (radians)
  period?: number // seconds for one rise and fall
  phase?: number // shifts the timing, so two floating things don't move together
  children: ReactNode
}

// Something floating on the water: it gently rises, sinks and rocks. The rocking turns
// around the group's own origin, so put that at the middle of the floating thing, at the
// waterline.
//
// useFrame runs the function before every frame is drawn (about 60 times a second). It
// changes the group directly, instead of through React state, so nothing re-renders.
export function Bobbing({ height = 0.05, roll = 0.02, pitch = 0.01, period = 4, phase = 0, children, ...props }: Props) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const group = ref.current
    if (!group) return
    // Three waves at different speeds, so the motion never repeats exactly.
    const t = (clock.elapsedTime / period) * Math.PI * 2 + phase
    group.position.y = Math.sin(t) * height
    group.rotation.x = Math.sin(t * 0.8 + 1) * roll
    group.rotation.z = Math.sin(t * 0.6 + 2) * pitch
  })
  return (
    <group {...props}>
      <group ref={ref}>{children}</group>
    </group>
  )
}

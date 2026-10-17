import type { ThreeElements } from '@react-three/fiber'

type Props = ThreeElements['meshStandardMaterial'] & { glow: number }

// The material for every part of the Boat zone. `glow` brightens it a little while the
// zone is hovered (emissive = light the surface gives off itself).
export function Paint({ glow, ...props }: Props) {
  return <meshStandardMaterial emissive="#ffffff" emissiveIntensity={glow} {...props} />
}

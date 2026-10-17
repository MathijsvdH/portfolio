import type { ThreeElements } from '@react-three/fiber'

// A standard material that can glow a little (used for the hover highlight).
// Flat shading shows each face, for the low-poly look.
export function Paint({ glow, ...props }: ThreeElements['meshStandardMaterial'] & { glow: number }) {
  return <meshStandardMaterial emissive="#ffffff" emissiveIntensity={glow} flatShading roughness={0.85} {...props} />
}

import type { ThreeElements } from '@react-three/fiber'
import { addSway } from '../../scene/sway'

type Props = ThreeElements['meshStandardMaterial'] & {
  glow: number
  sway?: boolean // moves in the wind, for leaves (src/scene/sway.ts)
}

// A standard material that can glow a little (used for the hover highlight).
// Flat shading shows each face, for the low-poly look.
export function Paint({ glow, sway = false, ...props }: Props) {
  // Only set onBeforeCompile when swaying: three.js expects a function there, never undefined.
  const wind = sway ? { onBeforeCompile: addSway } : {}
  return <meshStandardMaterial emissive="#ffffff" emissiveIntensity={glow} flatShading roughness={0.85} {...wind} {...props} />
}

import { useFrame } from '@react-three/fiber'
import { windTime } from './sway'

// Keeps the wind's clock (sway.ts) running: every frame it copies the time into the shared
// value that all swaying materials read. Draws nothing.
export function Wind() {
  useFrame(({ clock }) => {
    windTime.value = clock.elapsedTime
  })
  return null
}

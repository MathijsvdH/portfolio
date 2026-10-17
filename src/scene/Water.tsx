import { PALETTE } from './palette'

// Placeholder sea: a flat, slightly transparent plane at sea level (y = 0).
// Reaches past the fog, so its edge is never visible.
export function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[2500, 64]} />
      <meshStandardMaterial color={PALETTE.water} transparent opacity={0.85} />
    </mesh>
  )
}

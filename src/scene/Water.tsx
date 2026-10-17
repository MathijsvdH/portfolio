// Placeholder sea: a flat, slightly transparent plane at sea level (y = 0).
// Big enough to reach the horizon from the overview camera.
export function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[2500, 64]} />
      <meshStandardMaterial color="#2f8fc4" transparent opacity={0.85} />
    </mesh>
  )
}

// Placeholder sea: a flat, slightly transparent plane around the island.
export function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
      <circleGeometry args={[80, 64]} />
      <meshStandardMaterial color="#2f8fc4" transparent opacity={0.85} />
    </mesh>
  )
}

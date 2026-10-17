// Placeholder island: a sand base with a grass top.
// Replace with real terrain (heightmap or model) later.
export function Island() {
  return (
    <group>
      {/* Sand beach */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[11, 12, 1, 48]} />
        <meshStandardMaterial color="#e8d39a" />
      </mesh>

      {/* Grass on top */}
      <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[8, 9.5, 0.6, 48]} />
        <meshStandardMaterial color="#6bb35a" />
      </mesh>
    </group>
  )
}

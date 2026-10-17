export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      {/* The sun. Its shadow camera is a box that has to cover the whole island
          (~240 m plus the mountain), so it's much bigger than before. */}
      <directionalLight
        position={[200, 250, 100]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-170}
        shadow-camera-right={170}
        shadow-camera-top={170}
        shadow-camera-bottom={-170}
        shadow-camera-near={1}
        shadow-camera-far={800}
        shadow-normalBias={0.3}
      />
    </>
  )
}

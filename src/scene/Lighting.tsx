import { PALETTE } from './palette'

export function Lighting() {
  return (
    <>
      {/* Hemisphere light: soft light from all around, tinted like the sky from above
          and like the ground from below. Keeps shaded sides from going black. */}
      <hemisphereLight args={[PALETTE.skyLight, PALETTE.groundLight, 1.6]} />

      {/* The sun. Its shadow camera is a box that has to cover the whole island
          (~240 m plus the mountain). */}
      <directionalLight
        position={[200, 250, 100]}
        color={PALETTE.sun}
        intensity={2.4}
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

import { useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from './palette'

const RADIUS = 3000 // bigger than the sea (2500 m), smaller than the camera's view distance (5000 m)

// A painted sky: a huge ball around the world, seen from the inside, with a colour
// per point that goes from the horizon colour up to deep blue.
function skyGeometry() {
  const geometry = new THREE.SphereGeometry(RADIUS, 32, 16)
  const pos = geometry.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const top = new THREE.Color(PALETTE.skyTop)
  const horizon = new THREE.Color(PALETTE.skyHorizon)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const height = Math.max(0, pos.getY(i) / RADIUS) // 0 at the horizon, 1 straight up
    // Stays close to the horizon colour just above the horizon (matches the fog),
    // then turns blue; fully blue from about halfway up.
    c.copy(horizon).lerp(top, Math.min(1, height / 0.6) ** 1.2)
    c.toArray(colors, i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

export function SkyAndFog() {
  const geometry = useMemo(() => skyGeometry(), [])

  return (
    <>
      {/* Fog: things fade into the horizon colour with distance. Starts past the
          island so it stays crisp, and is complete before the edge of the sea. */}
      <fog attach="fog" args={[PALETTE.skyHorizon, 450, 1800]} />

      {/* BackSide: draw the inside of the ball. Basic material: the sky isn't lit
          by the sun. fog off: the sky already has the fog colour at the horizon. */}
      <mesh geometry={geometry}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
    </>
  )
}

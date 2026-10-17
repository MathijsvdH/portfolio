import { useMemo } from 'react'
import * as THREE from 'three'
import { heightAt } from './islandShape'

// The island is one "heightmap" mesh: a flat grid of points, each lifted to the
// height that heightAt() gives for that spot. The landscape itself lives in islandShape.ts.

const SIZE = 340 // metres covered by the grid (the island is ~240 m across)
const SEGMENTS = 272 // grid squares per side: one point every 1.25 m
const SEABED = -12 // depth of the open sea floor

const COLORS = {
  seabed: new THREE.Color('#c9b27c'),
  sand: new THREE.Color('#e8d39a'),
  grass: new THREE.Color('#6bb35a'),
  grassDark: new THREE.Color('#4f9447'),
  rock: new THREE.Color('#8a7b6a'),
  rockHigh: new THREE.Color('#a39a8f'),
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Ground colour from height and steepness. `up` is how much the ground faces
// upwards: 1 = flat, 0 = a vertical wall.
function groundColor(height: number, up: number, out: THREE.Color) {
  // Lowlands: grass, a bit darker higher up for variation.
  out.copy(COLORS.grass).lerp(COLORS.grassDark, smoothstep(10, 40, height))
  // Sand near sea level, seabed below the water.
  out.lerp(COLORS.sand, 1 - smoothstep(1.6, 2.6, height))
  out.lerp(COLORS.seabed, 1 - smoothstep(-1.5, -0.3, height))
  // Rock where it's steep (cliffs, mountain sides) and on the high mountain.
  const steep = 1 - smoothstep(0.72, 0.85, up)
  const high = smoothstep(55, 75, height)
  const rock = COLORS.rock.clone().lerp(COLORS.rockHigh, smoothstep(40, 90, height))
  out.lerp(rock, Math.max(steep, high))
  return out
}

function terrainGeometry() {
  const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS)
  geometry.rotateX(-Math.PI / 2) // the plane starts standing up; lay it flat

  // Lift every grid point to the ground height at its spot. Near the grid's edge,
  // sink it to the seabed depth so it meets the flat seabed without a step.
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const edge = smoothstep(SIZE / 2 - 30, SIZE / 2, Math.max(Math.abs(x), Math.abs(z)))
    pos.setY(i, THREE.MathUtils.lerp(heightAt(x, z), SEABED, edge))
  }
  geometry.computeVertexNormals() // recalculate which way each point faces, for lighting

  // Give every point a colour ("vertex colours"); the material blends between them.
  const normals = geometry.attributes.normal
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    groundColor(pos.getY(i), normals.getY(i), c)
    c.toArray(colors, i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

export function Island() {
  // Build the terrain once, not on every render.
  const geometry = useMemo(() => terrainGeometry(), [])

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors />
      </mesh>
      {/* Seabed for the rest of the sea, at the depth where the terrain grid ends,
          so the grid's square edge doesn't show through the water. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEABED - 0.05, 0]}>
        <circleGeometry args={[2500, 32]} />
        <meshStandardMaterial color={COLORS.seabed} />
      </mesh>
    </group>
  )
}

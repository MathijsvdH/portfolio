import type { ReactNode } from 'react'
import type * as THREE from 'three'
import type { Vec3 } from '../../scene/layout'
import { useZoneHover } from '../../scene/useZoneHover'
import { Paint } from './Paint'

// Small building blocks for Home's clickable objects.

export type Merged = { color: string; geometry: THREE.BufferGeometry }[]

// The merged meshes of a builder (one per colour), lighting up by `glow`.
export function MergedMeshes({ meshes, glow }: { meshes: Merged; glow: number }) {
  return meshes.map(({ color, geometry }) => (
    <mesh key={color} geometry={geometry} castShadow receiveShadow>
      <Paint color={color} emissive={color} glow={glow} />
    </mesh>
  ))
}

// A flat painted picture (a canvas texture from textures.ts), facing +z.
// It glows a little all the time, so painted text stays easy to read in the shade.
export function Picture({ texture, size, position, glow }: { texture: THREE.Texture; size: [number, number]; position: Vec3; glow: number }) {
  return (
    <mesh position={position} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={texture} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.3 + glow} roughness={0.9} />
    </mesh>
  )
}

type HotspotProps = {
  enabled: boolean // only clickable while the camera is at Home
  onClick: () => void
  hitbox: [Vec3, Vec3] // invisible box: centre and size
  lit?: boolean // also light up when the whole zone is hovered (from far away)
  children: (glow: number) => ReactNode
}

// Something you can hover and click: an invisible hitbox, and `children` drawn with the
// glow (0, or 0.3 while hovered).
export function Hotspot({ enabled, onClick, hitbox, lit = false, children }: HotspotProps) {
  const { hovered, handlers } = useZoneHover(onClick, enabled)
  const [centre, size] = hitbox
  return (
    <>
      {children(hovered || lit ? 0.3 : 0)}
      {enabled && (
        <mesh position={centre} visible={false} {...handlers}>
          <boxGeometry args={size} />
        </mesh>
      )}
    </>
  )
}

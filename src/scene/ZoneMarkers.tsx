import { useState } from 'react'
import { useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { ProjectId } from '../data/projects'
import { ZONES, type Vec3 } from './layout'

// TEMPORARY: a clickable post at every zone position from layout.ts, to test the
// fly-to camera before the real zones exist. Each zone step adds its id to BUILT,
// which removes its post; delete this file once all zones are built.
const BUILT: ProjectId[] = ['knot-tying', 'coral-reef', 'animal-classification']

export function ZoneMarkers({ onSelect }: { onSelect: (id: ProjectId) => void }) {
  return (Object.keys(ZONES) as ProjectId[]).map((id) => {
    const zone = ZONES[id]
    if (!zone || BUILT.includes(id)) return null
    return <Marker key={id} position={zone.position} onClick={() => onSelect(id)} />
  })
}

function Marker({ position, onClick }: { position: Vec3; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered) // pointer cursor while hovering

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 5) return // the mouse moved: that was a drag to rotate, not a click
    e.stopPropagation()
    onClick()
  }

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 13, 0]} castShadow>
        <sphereGeometry args={[2.5, 16, 12]} />
        <meshStandardMaterial color={hovered ? '#ffd23f' : '#ff6b4a'} />
      </mesh>
    </group>
  )
}

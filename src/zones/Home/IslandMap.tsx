import { useMemo } from 'react'
import { projects, type ProjectId } from '../../data/projects'
import { ZONES, type Vec3 } from '../../scene/layout'
import { Hotspot, MergedMeshes, Picture } from './Hotspot'
import { Pieces, groundY, mapStand } from './parts'
import type { ObjectProps } from './Sign'
import { MAP, MAP_AT } from './spots'
import { mapPoint, mapTexture, tagSide } from './textures'

// The island map on a stand by the water: a painted map of the real terrain with a pin for
// every project zone. Click a pin to fly there; click the map to step up to it first.

const PIN_COLORS = ['#e2402e', '#2f7fe0', '#f2a541', '#4caf50', '#9b59b6']

export function IslandMap({ origin, enabled, lit, onSelect }: ObjectProps) {
  const { x, z, turn } = MAP_AT
  const { width, height, bottom } = MAP
  const top = bottom + height

  const zones = useMemo(
    () =>
      (Object.keys(ZONES) as ProjectId[]).map((id, i) => {
        const [zx, , zz] = ZONES[id]!.position
        return { id, x: zx, z: zz, text: projects[id].title, color: PIN_COLORS[i % PIN_COLORS.length] }
      }),
    [],
  )
  const meshes = useMemo(() => {
    const p = new Pieces()
    mapStand(p, width, height, bottom)
    return p.build()
  }, [width, height, bottom])
  const texture = useMemo(() => mapTexture(zones, [origin[0], origin[2]]), [zones, origin])

  // A spot on the map (world x, z) on the board, in the stand's own coordinates.
  const onBoard = (wx: number, wz: number): [number, number] => {
    const [u, v] = mapPoint(wx, wz)
    return [(u - 0.5) * width, top - v * height]
  }

  return (
    <group position={[x, groundY(origin, x, z), z]} rotation={[0, turn, 0]}>
      <Hotspot enabled={enabled} lit={lit} onClick={() => onSelect('map')} hitbox={[[0, (top + 0.4) / 2, 0], [width + 0.3, top + 0.4, 0.1]]}>
        {(glow) => (
          <>
            <MergedMeshes meshes={meshes} glow={glow} />
            <Picture texture={texture} size={[width, height]} position={[0, bottom + height / 2, -0.005]} glow={glow} />
          </>
        )}
      </Hotspot>

      {zones.map((zone) => {
        const [px, py] = onBoard(zone.x, zone.z)
        // The hitbox covers the pin and its name tag (painted on the map, about 1.4 cm per letter).
        const tagWidth = 0.12 + zone.text.length * 0.0155
        const side = tagSide(zone.x, zone.z)
        return (
          <Pin
            key={zone.id}
            position={[px, py, 0]}
            color={zone.color}
            hitbox={[[px + (side * tagWidth) / 2, py, 0.06], [tagWidth + 0.1, 0.14, 0.14]]}
            enabled={enabled}
            lit={lit}
            onClick={() => onSelect(zone.id)}
          />
        )
      })}
    </group>
  )
}

type PinProps = {
  position: Vec3
  color: string
  hitbox: [Vec3, Vec3]
  enabled: boolean
  lit: boolean
  onClick: () => void
}

// A pin stuck in the map: a short needle and a round head.
function Pin({ position, color, hitbox, enabled, lit, onClick }: PinProps) {
  const [x, y] = position
  return (
    <Hotspot enabled={enabled} lit={lit} onClick={onClick} hitbox={hitbox}>
      {(glow) => (
        <group position={[x, y, 0]}>
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.08, 6]} />
            <meshStandardMaterial color="#d0d0d0" />
          </mesh>
          <mesh position={[0, 0, 0.09]} scale={glow ? 1.3 : 1} castShadow>
            <sphereGeometry args={[0.04, 12, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
          </mesh>
        </group>
      )}
    </Hotspot>
  )
}

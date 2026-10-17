import { useMemo } from 'react'
import { profile } from '../../data/profile'
import type { Place, Vec3 } from '../../scene/layout'
import { Hotspot, MergedMeshes, Picture } from './Hotspot'
import { Pieces, groundY, signStand } from './parts'
import { SIGN, SIGN_AT } from './spots'
import { signTexture } from './textures'

export type ObjectProps = {
  origin: Vec3 // the zone's position
  enabled: boolean // clickable: the camera is at Home
  lit: boolean // the whole zone is hovered (from far away)
  onSelect: (place: Place) => void
}

// The welcome sign by the path: your name and tagline, big enough to read from the start
// view, and the About me text for when you click it and the camera flies up close.
export function Sign({ origin, enabled, lit, onSelect }: ObjectProps) {
  const { x, z, turn } = SIGN_AT
  const { width, height, bottom } = SIGN
  const top = bottom + height
  const meshes = useMemo(() => {
    const p = new Pieces()
    signStand(p, width, height, bottom)
    return p.build()
  }, [width, height, bottom])
  const texture = useMemo(() => signTexture(profile.name, profile.tagline, profile.about), [])

  return (
    <group position={[x, groundY(origin, x, z), z]} rotation={[0, turn, 0]}>
      <Hotspot enabled={enabled} lit={lit} onClick={() => onSelect('about')} hitbox={[[0, (top + 0.5) / 2, 0], [width + 0.4, top + 0.5, 0.5]]}>
        {(glow) => (
          <>
            <MergedMeshes meshes={meshes} glow={glow} />
            <Picture texture={texture} size={[width, height]} position={[0, bottom + height / 2, 0.015]} glow={glow} />
          </>
        )}
      </Hotspot>
    </group>
  )
}

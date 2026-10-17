import { useMemo } from 'react'
import { profile, type Social } from '../../data/profile'
import { Hotspot, MergedMeshes, Picture } from './Hotspot'
import { Pieces, contactStand, groundY, mailbox, place } from './parts'
import type { ObjectProps } from './Sign'
import { CONTACT, CONTACT_AT } from './spots'
import { contactTexture, postcardTexture } from './textures'

// The mailbox by the porch steps, with a "Find me" board under it: one postcard per social
// link from profile.ts. Click a postcard to open the link.
export function Contact({ origin, enabled, lit, onSelect }: ObjectProps) {
  const { x, z, turn } = CONTACT_AT
  const { width, height, bottom } = CONTACT
  const meshes = useMemo(() => {
    const p = new Pieces()
    contactStand(p, width, height, bottom)
    mailbox(p, place([0, 0, -0.12])) // its post goes up behind the board
    return p.build()
  }, [width, height, bottom])
  const board = useMemo(() => contactTexture(), [])

  // Postcards in a row on the lower part of the board.
  const count = profile.socials.length
  const cardW = Math.min(0.3, (width - 0.08 - (count - 1) * 0.04) / count)
  const cardH = cardW * 0.7
  const cardY = bottom + height * 0.42

  return (
    <group position={[x, groundY(origin, x, z), z]} rotation={[0, turn, 0]}>
      <Hotspot enabled={enabled} lit={lit} onClick={() => onSelect('contact')} hitbox={[[0, 0.7, -0.1], [width + 0.15, 1.45, 0.5]]}>
        {(glow) => (
          <>
            <MergedMeshes meshes={meshes} glow={glow} />
            <Picture texture={board} size={[width, height]} position={[0, bottom + height / 2, -0.005]} glow={glow} />
          </>
        )}
      </Hotspot>

      {profile.socials.map((social, i) => (
        <Postcard
          key={social.kind}
          social={social}
          position={[(i - (count - 1) / 2) * (cardW + 0.04), cardY, 0]}
          tilt={i % 2 ? 0.05 : -0.04}
          size={[cardW, cardH]}
          enabled={enabled}
          lit={lit}
        />
      ))}
    </group>
  )
}

type PostcardProps = {
  social: Social
  position: [number, number, number]
  tilt: number
  size: [number, number]
  enabled: boolean
  lit: boolean
}

function Postcard({ social, position, tilt, size, enabled, lit }: PostcardProps) {
  const texture = useMemo(() => postcardTexture(social), [social])
  const [x, y] = position
  return (
    <Hotspot enabled={enabled && social.url !== ''} lit={lit} onClick={() => openLink(social.url)} hitbox={[[x, y, 0.05], [size[0] + 0.03, size[1] + 0.03, 0.24]]}>
      {(glow) => (
        <group position={position} rotation={[0, 0, tilt]}>
          <Picture texture={texture} size={size} position={[0, 0, 0.004]} glow={glow} />
        </group>
      )}
    </Hotspot>
  )
}

// Email links open the mail program; the others open in a new tab.
function openLink(url: string) {
  if (url.startsWith('mailto:')) window.location.href = url
  else window.open(url, '_blank', 'noreferrer')
}

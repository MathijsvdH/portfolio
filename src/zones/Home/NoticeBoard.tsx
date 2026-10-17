import { useMemo } from 'react'
import { profile } from '../../data/profile'
import { Hotspot, MergedMeshes, Picture } from './Hotspot'
import { COLORS, Pieces, boardFrame, hutFloor } from './parts'
import type { ObjectProps } from './Sign'
import { BOARD, BOARD_AT } from './spots'
import { BOARD_FREE_FROM, boardTexture, cvTexture } from './textures'

// The notice board on the hut's front wall: skills and tools as paper notes, and the CV
// as a separate sheet you can click to download.
export function NoticeBoard({ origin, enabled, lit, onSelect }: ObjectProps) {
  const { width, height, bottom } = BOARD
  const floor = useMemo(() => hutFloor(origin), [origin])
  const meshes = useMemo(() => {
    const p = new Pieces()
    boardFrame(p, width, height)
    return p.build()
  }, [width, height])
  const cork = { width: width - 0.1, height: height - 0.12 }
  const board = useMemo(() => boardTexture(profile.skills), [])

  // The CV sheet, in the free part on the right of the cork.
  const cvReady = profile.cvUrl !== null
  const cv = useMemo(() => cvTexture(cvReady), [cvReady])
  const cvSize: [number, number] = [0.34, 0.44]
  const cvX = -cork.width / 2 + (cork.width * (1 + BOARD_FREE_FROM)) / 2
  const cvY = -0.04

  return (
    <group position={[BOARD_AT.x, floor + bottom + height / 2, BOARD_AT.z]}>
      <Hotspot enabled={enabled} lit={lit} onClick={() => onSelect('skills')} hitbox={[[0, 0, 0.06], [width + 0.1, height + 0.1, 0.12]]}>
        {(glow) => (
          <>
            <MergedMeshes meshes={meshes} glow={glow} />
            <Picture texture={board} size={[cork.width, cork.height]} position={[0, 0, 0.05]} glow={glow} />
          </>
        )}
      </Hotspot>

      <Hotspot enabled={enabled && cvReady} lit={lit} onClick={() => download(profile.cvUrl!)} hitbox={[[cvX, cvY, 0.1], [cvSize[0] + 0.04, cvSize[1] + 0.04, 0.1]]}>
        {(glow) => (
          <group position={[cvX, cvY, 0]} rotation={[0, 0, 0.04]}>
            <Picture texture={cv} size={cvSize} position={[0, 0, 0.056]} glow={glow} />
            <mesh position={[0, cvSize[1] / 2 - 0.03, 0.065]}>
              <sphereGeometry args={[0.014, 8, 6]} />
              <meshStandardMaterial color={COLORS.flag} />
            </mesh>
          </group>
        )}
      </Hotspot>
    </group>
  )
}

// Downloads a file, the same as clicking a link with the `download` attribute.
function download(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.click()
}

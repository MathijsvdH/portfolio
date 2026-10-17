import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Island } from './scene/Island'
import { Water } from './scene/Water'
import { Lighting } from './scene/Lighting'
import { SkyAndFog } from './scene/SkyAndFog'
import { CameraRig } from './scene/CameraRig'
import { ZoneMarkers } from './scene/ZoneMarkers'
import { OVERVIEW, ZONES } from './scene/layout'
import { ProjectPanel } from './ui/ProjectPanel'
import { BackButton } from './ui/BackButton'
import { projects, type ProjectId } from './data/projects'

export default function App() {
  // Which project panel is open. Zones call setSelected(id) on click.
  const [selected, setSelected] = useState<ProjectId | null>(null)

  // Where the camera should be: the open zone's viewpoint, or the whole island.
  const view = selected ? (ZONES[selected]?.camera ?? OVERVIEW) : OVERVIEW

  return (
    <>
      {/* shadows="percentage": smoothed shadow edges (the "soft" type no longer exists in three.js).
          Neutral tone mapping keeps the palette's colours bright; the default (ACES) greys them out. */}
      <Canvas
        shadows="percentage"
        gl={{ toneMapping: THREE.NeutralToneMapping }}
        camera={{ position: OVERVIEW.position, fov: 45, near: 0.5, far: 5000 }}
      >
        <SkyAndFog />
        <Lighting />
        <Island />
        <Water />

        {/* Zones go here, e.g. <CoralReef position={ZONES['coral-reef'].position} onSelect={setSelected} />.
            Until then, temporary posts mark the zone spots. */}
        <ZoneMarkers onSelect={setSelected} />

        <CameraRig view={view} />
      </Canvas>

      {selected && (
        <>
          <ProjectPanel project={projects[selected]} onClose={() => setSelected(null)} />
          <BackButton onClick={() => setSelected(null)} />
        </>
      )}
    </>
  )
}

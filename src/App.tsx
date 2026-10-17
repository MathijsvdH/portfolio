import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { Island } from './scene/Island'
import { Water } from './scene/Water'
import { Lighting } from './scene/Lighting'
import { SkyAndFog } from './scene/SkyAndFog'
import { OVERVIEW } from './scene/layout'
import { ProjectPanel } from './ui/ProjectPanel'
import { projects, type ProjectId } from './data/projects'

export default function App() {
  // Which project panel is open. Zones call setSelected(id) on click.
  const [selected, setSelected] = useState<ProjectId | null>(null)

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

        {/* Zones go here, e.g. <CoralReef position={[8, 0, 2]} onSelect={setSelected} /> */}

        <OrbitControls
          target={OVERVIEW.target}
          minDistance={30}
          maxDistance={550}
          maxPolarAngle={Math.PI / 2.2} // stop the camera going below the water
          enablePan={false}
        />
      </Canvas>

      {selected && (
        <ProjectPanel project={projects[selected]} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

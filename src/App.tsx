import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { Island } from './scene/Island'
import { Water } from './scene/Water'
import { Lighting } from './scene/Lighting'
import { OVERVIEW } from './scene/layout'
import { ProjectPanel } from './ui/ProjectPanel'
import { projects, type ProjectId } from './data/projects'

export default function App() {
  // Which project panel is open. Zones call setSelected(id) on click.
  const [selected, setSelected] = useState<ProjectId | null>(null)

  return (
    <>
      <Canvas shadows camera={{ position: OVERVIEW.position, fov: 45, near: 0.5, far: 5000 }}>
        <Sky sunPosition={[50, 30, 20]} />
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

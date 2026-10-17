import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Island } from './scene/Island'
import { Water } from './scene/Water'
import { Lighting } from './scene/Lighting'
import { SkyAndFog } from './scene/SkyAndFog'
import { CameraRig } from './scene/CameraRig'
import { ScreenAnchors } from './scene/ScreenAnchors'
import { ZoneMarkers } from './scene/ZoneMarkers'
import { ModelShelf } from './scene/ModelShelf'
import { HOME, OVERVIEW, ZONES, atHome, isProject, type Place } from './scene/layout'
import { ProjectPanel } from './ui/ProjectPanel'
import { BackButton } from './ui/BackButton'
import { HomeLabels } from './ui/HomeLabels'
import { CornerMenu } from './ui/CornerMenu'
import { Boat } from './zones/Boat/Boat'
import { CoralReef } from './zones/CoralReef/CoralReef'
import { Wildlife } from './zones/Wildlife/Wildlife'
import { RobotCorner } from './zones/RobotCorner/RobotCorner'
import { Home } from './zones/Home/Home'
import { homeLabels, homeView } from './zones/Home/spots'
import { projects, type ProjectId } from './data/projects'

// TEMPORARY: http://localhost:5173/?models shows all 3D models in a row behind Home.
const SHOW_MODELS = new URLSearchParams(window.location.search).has('models')

export default function App() {
  // Where the camera is: a project zone, Home (the start view on the beach), one of Home's
  // spots, or null for the overview of the whole island. Zones call select(place) on click.
  const [selected, setSelected] = useState<Place | null>('home')
  // The project the panel shows. It keeps the last one after closing, so the panel
  // can still show its text while it fades out.
  const [panelProject, setPanelProject] = useState<ProjectId | null>(null)

  function select(place: Place | null) {
    setSelected(place)
    if (isProject(place)) setPanelProject(place)
  }

  // Where the camera should be. useMemo: the same place gives the same view object, so the
  // camera only flies when the place changes.
  const view = useMemo(() => {
    if (selected === null) return OVERVIEW
    if (isProject(selected)) return ZONES[selected]?.camera ?? OVERVIEW
    return homeView(selected)
  }, [selected])

  // Name tags over the clickable things at Home, shown at the start view.
  const labels = useMemo(() => homeLabels(), [])
  const labelPoints = useMemo(() => labels.map((l) => l.at), [labels])
  const labelElements = useRef<(HTMLElement | null)[]>([])

  // The button at the bottom: from the beach up to the island, and back again.
  const [buttonLabel, buttonTo]: [string, Place | null] =
    selected === 'home'
      ? ['Explore the island ↑', null]
      : atHome(selected)
        ? ['← Back to the beach', 'home']
        : selected
          ? ['← Back to island', null]
          : ['⌂ Back to the beach', 'home']

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
        <ZoneMarkers onSelect={select} />
        <Boat position={ZONES['knot-tying']!.position} onSelect={select} />
        <CoralReef position={ZONES['coral-reef']!.position} onSelect={select} />
        {/* Suspense: Wildlife waits for the model file, the rest of the island doesn't. */}
        <Suspense fallback={null}>
          <Wildlife position={ZONES['animal-classification']!.position} onSelect={select} />
        </Suspense>
        <RobotCorner position={ZONES.robotics!.position} onSelect={select} />
        <Home position={HOME.position} place={selected} onSelect={select} />

        {/* Suspense: what's inside waits for the model file, the rest of the island doesn't. */}
        <Suspense fallback={null}>{SHOW_MODELS && <ModelShelf />}</Suspense>

        <CameraRig view={view} />
        <ScreenAnchors points={labelPoints} elements={labelElements} />
      </Canvas>

      <HomeLabels labels={labels} show={selected === 'home'} refs={labelElements} onSelect={select} />
      <CornerMenu selected={selected} onSelect={select} />

      {/* key: switching to another project remounts the panel, so it animates in again. */}
      {panelProject && (
        <ProjectPanel
          key={panelProject}
          project={projects[panelProject]}
          open={isProject(selected)}
          onClose={() => select(null)}
        />
      )}
      <BackButton label={buttonLabel} onClick={() => select(buttonTo)} />
    </>
  )
}

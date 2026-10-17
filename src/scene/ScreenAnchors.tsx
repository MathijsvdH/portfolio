import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from './layout'

type Props = {
  points: Vec3[] // spots in the world
  elements: RefObject<(HTMLElement | null)[]> // one HTML element per point, outside the canvas
}

// Keeps normal HTML elements (like name tags) on top of 3D spots. Every frame it works out
// where each spot is on the screen ("projecting" it with the camera) and moves its element
// there. The elements themselves live in the 2D UI (see src/ui/HomeLabels.tsx).
export function ScreenAnchors({ points, elements }: Props) {
  useFrame(({ camera, size }) => {
    points.forEach((point, i) => {
      const el = elements.current[i]
      if (!el) return
      v.set(...point).project(camera) // now -1..1 across the screen, z > 1 means behind the camera
      const x = ((v.x + 1) / 2) * size.width
      const y = ((1 - v.y) / 2) * size.height
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      el.style.display = v.z > 1 ? 'none' : ''
    })
  })
  return null
}

const v = new THREE.Vector3()

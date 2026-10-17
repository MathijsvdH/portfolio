import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import * as THREE from 'three'
import { heightAt } from './islandShape'
import type { Viewpoint } from './layout'

// The camera: visitors can rotate and zoom around the current view (drei CameraControls),
// and when `view` changes the camera flies there in an arc over the island.

const { ACTION } = CameraControlsImpl
const CLEARANCE = 20 // metres the camera stays above the ground while flying

type Flight = {
  fromPosition: THREE.Vector3
  fromTarget: THREE.Vector3
  toPosition: THREE.Vector3
  toTarget: THREE.Vector3
  lift: number // how high the arc goes above the straight line, in metres
  duration: number // seconds
  time: number // seconds flown so far
}

// Ease in and out, so the flight starts and stops gently.
function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

// A straight line between two views can go through the mountain. Find how far the
// middle of the flight has to be lifted (in an arc, sin) to stay CLEARANCE above the ground.
function liftNeeded(from: THREE.Vector3, to: THREE.Vector3) {
  const p = new THREE.Vector3()
  let lift = 0
  for (let t = 0.02; t < 0.98; t += 0.02) {
    p.lerpVectors(from, to, t)
    const short = heightAt(p.x, p.z) + CLEARANCE - p.y
    if (short > 0) lift = Math.max(lift, short / Math.sin(Math.PI * t))
  }
  return Math.min(lift, 120)
}

export function CameraRig({ view }: { view: Viewpoint }) {
  const controls = useRef<CameraControlsImpl>(null)
  const flight = useRef<Flight | null>(null)
  const firstView = useRef(true)

  // The viewpoints are made for a wide screen. On a narrow (portrait phone) screen less
  // fits from side to side, so step back from the target, up to 1.8x as far.
  const aspect = useThree((state) => state.size.width / state.size.height)
  const backOff = THREE.MathUtils.clamp(1.6 / aspect, 1, 1.8)

  // Runs when `view` changes: plan a flight from wherever the camera is now.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const toTarget = new THREE.Vector3(...view.target)
    const toPosition = new THREE.Vector3(...view.position).sub(toTarget).multiplyScalar(backOff).add(toTarget)
    if (firstView.current) {
      // On page load, just start at the view, no flight.
      firstView.current = false
      c.setLookAt(...toPosition.toArray(), ...toTarget.toArray(), false)
      return
    }
    const fromPosition = c.getPosition(new THREE.Vector3())
    flight.current = {
      fromPosition,
      fromTarget: c.getTarget(new THREE.Vector3()),
      toPosition,
      toTarget,
      lift: liftNeeded(fromPosition, toPosition),
      duration: THREE.MathUtils.clamp(1 + fromPosition.distanceTo(toPosition) / 250, 1.2, 2.5),
      time: 0,
    }
    c.enabled = false // no dragging while flying
  }, [view, backOff])

  // useFrame runs every frame: move the camera a bit further along the flight.
  const position = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3())
  useFrame((_, delta) => {
    const f = flight.current
    const c = controls.current
    if (!f || !c) return
    f.time = Math.min(f.time + delta, f.duration)
    const t = ease(f.time / f.duration)
    const p = position.current.lerpVectors(f.fromPosition, f.toPosition, t)
    p.y += f.lift * Math.sin(Math.PI * t)
    const look = target.current.lerpVectors(f.fromTarget, f.toTarget, t)
    c.setLookAt(p.x, p.y, p.z, look.x, look.y, look.z, false)
    if (f.time === f.duration) {
      flight.current = null
      c.enabled = true
    }
  })

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={30}
      maxDistance={550}
      maxPolarAngle={Math.PI / 2.2} // stop the camera going below the water
      // Left drag rotates, wheel/pinch zooms. No panning, so visitors can't drift off the island.
      mouseButtons={{ left: ACTION.ROTATE, middle: ACTION.DOLLY, right: ACTION.NONE, wheel: ACTION.DOLLY }}
      touches={{ one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY, three: ACTION.NONE }}
    />
  )
}

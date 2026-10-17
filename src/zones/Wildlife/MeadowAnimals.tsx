import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '../../scene/layout'
import { HEAD_TILT, NECK, NECK_BASE, TAIL_BASE, deer, fox, hedgehog, rabbit, robin } from './animals'
import { Paint } from './Paint'
import { Pieces, groundY } from './parts'
import { DOE, FOX, HEDGEHOG, LOG, RABBITS, ROBINS, STAG } from './spots'

// The meadow's animals, each moving a little in its own way:
//   stag      stands alert and slowly looks around
//   doe       grazes with her head down, now and then looks up
//   fox       swishes its tail
//   rabbits   hop around in small circles
//   robins    hop and turn on the log
//   hedgehog  shuffles about
// Each animal is its own group (not merged with the meadow), so useFrame can move it every
// frame. The deer's neck and head and the fox's tail are groups inside the animal, so they
// turn around their own joint.

type Props = { origin: Vec3; glow: number }

export function MeadowAnimals({ origin, glow }: Props) {
  const [lx, lz, lturn] = LOG
  return (
    <>
      <Deer origin={origin} spot={STAG} antlers glow={glow} />
      <Deer origin={origin} spot={DOE} scale={0.88} glow={glow} grazes />
      <Fox origin={origin} glow={glow} />
      {RABBITS.map((spot, i) => (
        <Rabbit key={i} origin={origin} spot={spot} seed={i} glow={glow} />
      ))}
      <Hedgehog origin={origin} glow={glow} />
      {ROBINS.map(([along, look], i) => (
        <Robin key={i} origin={origin} at={[lx + Math.cos(lturn) * along, lz - Math.sin(lturn) * along]} logY={groundY(origin, lx, lz) + 0.69} turn={lturn + look} seed={i} glow={glow} />
      ))}
    </>
  )
}

// The merged shapes of one Pieces, one mesh per colour.
function Shapes({ pieces, glow }: { pieces: { color: string; geometry: THREE.BufferGeometry }[]; glow: number }) {
  return pieces.map(({ color, geometry }) => (
    <mesh key={color} geometry={geometry} castShadow receiveShadow>
      <Paint color={color} emissive={color} glow={glow} />
    </mesh>
  ))
}

// Goes smoothly from 0 to 1 between `from` and `to`.
function ease(t: number, from: number, to: number) {
  const f = Math.min(1, Math.max(0, (t - from) / (to - from)))
  return f * f * (3 - 2 * f)
}

// A "random" number 0..1 that's the same every time for the same n.
function chance(n: number) {
  const x = Math.sin(n * 91.7) * 43758.5453
  return x - Math.floor(x)
}

type DeerProps = { origin: Vec3; spot: Vec3; scale?: number; antlers?: boolean; grazes?: boolean; glow: number }

function Deer({ origin, spot, scale = 1, antlers = false, grazes = false, glow }: DeerProps) {
  const neck = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const parts = useMemo(() => {
    const p = { body: new Pieces(), neck: new Pieces(), head: new Pieces() }
    deer(p, antlers)
    return { body: p.body.build(), neck: p.neck.build(), head: p.head.build() }
  }, [antlers])
  const [x, z, turn] = spot

  useFrame(({ clock }) => {
    if (!neck.current || !head.current) return
    const t = clock.elapsedTime
    if (grazes) {
      // One round of 12 s: head down (1.2 s), graze (6 s), head up (1.2 s), look (3.6 s).
      const r = t % 12
      const down = ease(r, 0, 1.2) - ease(r, 7.2, 8.4)
      // Down to the grass: the neck swings forward and down, the head tips further, and
      // nibbles while it's down.
      neck.current.rotation.z = -2 * down
      head.current.rotation.z = HEAD_TILT + 1.25 * down + Math.sin(t * 7) * 0.06 * down
    } else {
      // Look somewhere new every 4 seconds: left, right or ahead.
      const n = Math.floor(t / 4)
      const from = (chance(n) - 0.5) * 1.4
      const to = (chance(n + 1) - 0.5) * 1.4
      head.current.rotation.set(0, from + (to - from) * ease(t % 4, 3, 4), HEAD_TILT)
    }
  })

  const [nx, ny] = NECK
  return (
    <group position={[x, groundY(origin, x, z), z]} rotation={[0, turn, 0]} scale={scale}>
      <Shapes pieces={parts.body} glow={glow} />
      <group ref={neck} position={NECK_BASE}>
        <Shapes pieces={parts.neck} glow={glow} />
        <group ref={head} position={[nx, ny, 0]} rotation={[0, 0, HEAD_TILT]}>
          <Shapes pieces={parts.head} glow={glow} />
        </group>
      </group>
    </group>
  )
}

function Fox({ origin, glow }: { origin: Vec3; glow: number }) {
  const tail = useRef<THREE.Group>(null)
  const parts = useMemo(() => {
    const body = new Pieces()
    const tailPieces = new Pieces()
    fox(body, tailPieces)
    return { body: body.build(), tail: tailPieces.build() }
  }, [])
  const [x, z, turn] = FOX

  useFrame(({ clock }) => {
    if (!tail.current) return
    const t = clock.elapsedTime
    // Swishes for 2 s out of every 5 s.
    const swishing = ease(t % 5, 0, 0.4) - ease(t % 5, 1.6, 2)
    tail.current.rotation.y = Math.sin(t * 6) * 0.4 * swishing
  })

  return (
    <group position={[x, groundY(origin, x, z), z]} rotation={[0, turn, 0]}>
      <Shapes pieces={parts.body} glow={glow} />
      <group ref={tail} position={TAIL_BASE}>
        <Shapes pieces={parts.tail} glow={glow} />
      </group>
    </group>
  )
}

// A rabbit sits, then hops a short way round a small circle around its spot (one hop
// every 3 seconds, at a different moment for each rabbit).
const HOP = { every: 3, time: 0.35, height: 0.22, step: 0.5, circle: 0.9 }

function Rabbit({ origin, spot, seed, glow }: { origin: Vec3; spot: Vec3; seed: number; glow: number }) {
  const ref = useRef<THREE.Group>(null)
  const pieces = useMemo(() => {
    const p = new Pieces()
    rabbit(p)
    return p.build()
  }, [])
  const [hx, hz, start] = spot

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + seed * 1.1
    const n = Math.floor(t / HOP.every)
    const f = ease(t - n * HOP.every, 0, HOP.time) // 0..1 during the hop
    // Where on the circle it is: one step further for every hop.
    const angle = start + (n + f) * (HOP.step / HOP.circle)
    const x = hx + Math.cos(angle) * HOP.circle
    const z = hz - Math.sin(angle) * HOP.circle
    const air = Math.sin(Math.PI * f) * HOP.height
    g.position.set(x, groundY(origin, x, z) + air, z)
    // Face along the circle (anticlockwise seen from above), nose down a little in the air.
    g.rotation.set(0, angle + Math.PI / 2, -air * 1.2, 'YXZ')
  })

  return (
    <group ref={ref}>
      <Shapes pieces={pieces} glow={glow} />
    </group>
  )
}

// A robin on the log: every few seconds it hops a little way along it and turns to look
// somewhere else.
function Robin({ at, logY, turn, seed, glow }: { origin: Vec3; at: [number, number]; logY: number; turn: number; seed: number; glow: number }) {
  const ref = useRef<THREE.Group>(null)
  const pieces = useMemo(() => {
    const p = new Pieces()
    robin(p)
    return p.build()
  }, [])

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + seed * 1.9
    const every = 2.3 + seed * 0.6
    const n = Math.floor(t / every)
    const f = ease(t - n * every, 0, 0.2)
    // Along the log, back and forth a little; the log runs along `turn - look`, close enough.
    const along = (chance(n + seed * 10) - 0.5) * 0.3 * f + (chance(n - 1 + seed * 10) - 0.5) * 0.3 * (1 - f)
    const look = turn + (chance(n + seed * 10 + 5) - 0.5) * 2.5 * f + (chance(n - 1 + seed * 10 + 5) - 0.5) * 2.5 * (1 - f)
    g.position.set(at[0] + Math.cos(turn) * along, logY + Math.sin(Math.PI * f) * 0.05, at[1] - Math.sin(turn) * along)
    g.rotation.y = look
  })

  return (
    <group ref={ref}>
      <Shapes pieces={pieces} glow={glow} />
    </group>
  )
}

// The hedgehog shuffles slowly round a small loop near its spot, rocking as it goes.
function Hedgehog({ origin, glow }: { origin: Vec3; glow: number }) {
  const ref = useRef<THREE.Group>(null)
  const pieces = useMemo(() => {
    const p = new Pieces()
    hedgehog(p)
    return p.build()
  }, [])
  const [hx, hz, start] = HEDGEHOG

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    // Slowly round a small oval: walks 10 s, stops 4 s to sniff, and so on. `walked` is
    // how many seconds it has walked so far.
    const r = t % 14
    const walked = Math.floor(t / 14) * 10 + Math.min(r, 9) + Math.max(0, r - 13)
    const walking = 1 - (ease(r, 9, 9.5) - ease(r, 12.5, 13))
    const angle = start + walked * 0.08
    const x = hx + Math.cos(angle) * 1.2
    const z = hz - Math.sin(angle) * 0.7
    g.position.set(x, groundY(origin, x, z), z)
    g.rotation.set(Math.sin(t * 8) * 0.06 * walking, angle + Math.PI / 2, 0, 'YXZ')
  })

  return (
    <group ref={ref}>
      <Shapes pieces={pieces} glow={glow} />
    </group>
  )
}

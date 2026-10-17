import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from '../../scene/layout'
import { Paint } from './Paint'
import { COLORS, DECK_HEIGHT, groundY, hangingNet, netTexture, netUv, rope, v3 } from './parts'

// Scenery around the jetty, in zone coordinates: nets drying on a rack on the beach,
// a pile of net, crates and a barrel on the jetty, and a line of floats in the water.

const RACK_X = -4
const RACK_POLES = [-3.2, -6.2, -9.2] // z of each pole, along the beach
const POLE_HEIGHT = 2.6
const NET_DROP = 1.8
const NET_SAG = 0.15

const PILE: [number, number] = [-2.2, 3.4] // x, z of the net pile on the sand

type Props = { origin: Vec3; glow: number }

export function FishingGear({ origin, glow }: Props) {
  const gear = useMemo(() => {
    const tops = RACK_POLES.map((z) => v3(RACK_X, groundY(origin, RACK_X, z) + POLE_HEIGHT, z))

    // Between each pair of poles: a sagging line with a net hanging from it.
    const spans = tops.slice(1).map((b, i) => {
      const a = tops[i]
      const width = a.distanceTo(b)
      return {
        line: rope(a, b, NET_SAG),
        net: hangingNet(width - 0.2, NET_DROP, NET_SAG),
        position: a.clone().lerp(b, 0.5).setY(Math.min(a.y, b.y) - 0.04),
        // Floats on the top line, following its sag.
        floats: [0.2, 0.4, 0.6, 0.8].map((u) => {
          const p = a.clone().lerp(b, u)
          p.y -= NET_SAG * Math.sin(Math.PI * u) + 0.05
          return p
        }),
      }
    })

    // The net pile: a low mound with net draped over it.
    const pileY = groundY(origin, PILE[0], PILE[1]) - 0.05
    const mound = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    const pileNet = netUv(new THREE.SphereGeometry(1.04, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 6, 1.6)

    // A curved line of floats in the water, from the end of the jetty out to sea.
    const buoyCurve = new THREE.QuadraticBezierCurve3(v3(21, 0.05, 1.8), v3(26, 0.05, 2), v3(28, 0.05, 9))
    const buoys = buoyCurve.getSpacedPoints(7)
    const buoyLine = new THREE.TubeGeometry(buoyCurve, 30, 0.025, 5)

    return { tops, spans, pileY, mound, pileNet, buoys, buoyLine }
  }, [origin])

  const net = netTexture()

  return (
    <group>
      {/* Drying rack: poles with nets hanging between them. */}
      {gear.tops.map((t) => (
        <mesh key={t.z} position={[t.x, t.y - POLE_HEIGHT / 2 - 0.3, t.z]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, POLE_HEIGHT + 0.6, 8]} />
          <Paint color={COLORS.woodDark} glow={glow} />
        </mesh>
      ))}
      {gear.spans.map((s, i) => (
        <group key={i}>
          <mesh geometry={s.line}>
            <Paint color={COLORS.rope} glow={glow} />
          </mesh>
          {/* The net plane faces along x, so turn it to hang along the beach (z). */}
          <mesh geometry={s.net} position={s.position} rotation={[0, Math.PI / 2, 0]} castShadow>
            <Paint color={COLORS.net} glow={glow} map={net} alphaTest={0.4} side={THREE.DoubleSide} />
          </mesh>
          {s.floats.map((p, j) => (
            <mesh key={j} position={p} castShadow>
              <sphereGeometry args={[0.09, 8, 6]} />
              <Paint color={COLORS.float} glow={glow} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Net pile on the sand, with a few floats caught in it. */}
      <group position={[PILE[0], gear.pileY, PILE[1]]} scale={[1.2, 0.45, 0.9]}>
        <mesh geometry={gear.mound} castShadow receiveShadow>
          <Paint color={COLORS.netDark} glow={glow} />
        </mesh>
        <mesh geometry={gear.pileNet}>
          <Paint color={COLORS.net} glow={glow} map={net} alphaTest={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {[
        [-2.9, 0.25, 3.0],
        [-1.6, 0.35, 3.8],
        [-2.0, 0.42, 2.9],
      ].map(([x, dy, z]) => (
        <mesh key={x} position={[x, gear.pileY + dy, z]} castShadow>
          <sphereGeometry args={[0.13, 8, 6]} />
          <Paint color={COLORS.float} glow={glow} />
        </mesh>
      ))}

      {/* Crates and a barrel along the north edge of the jetty. */}
      <mesh position={[2.6, DECK_HEIGHT + 0.3, -0.75]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <Paint color={COLORS.crate} glow={glow} />
      </mesh>
      <mesh position={[2.65, DECK_HEIGHT + 0.85, -0.75]} rotation={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <Paint color={COLORS.crate} glow={glow} />
      </mesh>
      <mesh position={[3.4, DECK_HEIGHT + 0.3, -0.7]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <Paint color={COLORS.crate} glow={glow} />
      </mesh>
      <mesh position={[4.4, DECK_HEIGHT + 0.45, -0.7]} castShadow>
        <cylinderGeometry args={[0.32, 0.3, 0.9, 12]} />
        <Paint color={COLORS.hullLow} glow={glow} />
      </mesh>

      {/* Line of floats in the water. */}
      <mesh geometry={gear.buoyLine}>
        <Paint color={COLORS.rope} glow={glow} />
      </mesh>
      {gear.buoys.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.22, 10, 8]} />
          <Paint color={i % 2 ? COLORS.floatWhite : COLORS.float} glow={glow} />
        </mesh>
      ))}
    </group>
  )
}

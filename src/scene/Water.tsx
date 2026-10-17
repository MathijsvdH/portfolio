import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SEABED, TERRAIN_SIZE, terrainHeight } from './islandShape'
import { PALETTE } from './palette'

// The sea: one flat plane at sea level (y = 0) with its own small shader.
// A shader is a tiny program that runs on the graphics card for every pixel, so the
// colour can change across the water: turquoise in the shallows, deep blue further
// out, foam at the shore, and moving ripples.

const MAP_TEXELS = 384 // depth map resolution: one value every ~0.9 m
const MAX_DEPTH = -SEABED // 12 m: the open sea, and everything outside the depth map

// The shader can't call terrainHeight() itself, so we measure the water depth once
// and store it in a small greyscale image (a "depth map") that the shader reads.
// Stored as sqrt(depth) so there's more precision near the shore, where the foam is.
function depthMap() {
  const data = new Uint8Array(MAP_TEXELS * MAP_TEXELS)
  for (let j = 0; j < MAP_TEXELS; j++) {
    for (let i = 0; i < MAP_TEXELS; i++) {
      const x = ((i + 0.5) / MAP_TEXELS - 0.5) * TERRAIN_SIZE
      const z = ((j + 0.5) / MAP_TEXELS - 0.5) * TERRAIN_SIZE
      const depth = THREE.MathUtils.clamp(-terrainHeight(x, z) / MAX_DEPTH, 0, 1)
      data[j * MAP_TEXELS + i] = Math.round(Math.sqrt(depth) * 255)
    }
  }
  const texture = new THREE.DataTexture(data, MAP_TEXELS, MAP_TEXELS, THREE.RedFormat)
  texture.magFilter = THREE.LinearFilter // blend between values, for smooth foam lines
  texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vWorld; // position on the sea (x, z) in metres

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform sampler2D uDepthMap;
  uniform float uMapSize;
  uniform float uMaxDepth;
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uFoam;
  varying vec2 vWorld;

  // Smooth random values (value noise), same idea as in islandShape.ts.
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    // Water depth here, in metres (outside the map the edge value, open sea, is used).
    float stored = texture(uDepthMap, vWorld / uMapSize + 0.5).r;
    float depth = stored * stored * uMaxDepth;

    // Colour and see-through-ness from depth: clear turquoise over sand, deep blue further out.
    float deep = smoothstep(0.0, 9.0, depth);
    vec3 color = mix(uShallow, uDeep, pow(deep, 0.7));
    float alpha = mix(0.68, 0.95, deep);

    // Ripples: thin bright lines where two drifting noise patterns cross a value.
    vec2 p = vWorld * 0.08;
    float n = noise(p + vec2(0.30, 0.20) * uTime) + noise(p * 1.7 - vec2(0.25, -0.15) * uTime);
    float blur = fwidth(n); // how fast n changes per pixel: big far away
    float ripple = 1.0 - smoothstep(0.0, 0.04 + blur, abs(n - 1.0));
    color += ripple * 0.05 * (1.0 - smoothstep(0.02, 0.1, blur)); // fade out far away to avoid flicker

    // Foam: a white edge along the shore, plus bands that roll in towards it.
    float edge = 1.0 - smoothstep(0.12, 0.4, depth);
    float wobble = noise(vWorld * 0.15) * 4.0; // so the bands aren't perfect copies of the coastline
    float band = sin(depth * 7.0 + uTime * 1.5 + wobble);
    float waves = smoothstep(0.75, 0.95, band) * (1.0 - smoothstep(0.3, 1.3, depth));
    float foam = max(edge, waves * 0.8);
    color = mix(color, uFoam, foam);
    alpha = mix(alpha, 1.0, foam);

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

export function Water() {
  const material = useRef<THREE.ShaderMaterial>(null)

  // "Uniforms" are the values the shader gets from JavaScript. Made once.
  const uniforms = useMemo(
    () => ({
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uDepthMap: { value: depthMap() },
      uMapSize: { value: TERRAIN_SIZE },
      uMaxDepth: { value: MAX_DEPTH },
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color(PALETTE.waterShallow) },
      uDeep: { value: new THREE.Color(PALETTE.waterDeep) },
      uFoam: { value: new THREE.Color(PALETTE.foam) },
    }),
    [],
  )

  // useFrame runs every frame (~60 times a second): pass the time on, so the ripples and foam move.
  useFrame((state) => {
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  // Reaches past the fog, so its edge is never visible. fog: let three.js pass in the scene's fog.
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2500, 64]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        fog
      />
    </mesh>
  )
}

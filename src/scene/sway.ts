import type * as THREE from 'three'

// Wind for leaves: a material with `onBeforeCompile={addSway}` moves its corners a little
// back and forth, so tree tops and palm leaves sway.
//
// onBeforeCompile lets us change a material's shader (the small program the graphics card
// runs for every corner) before it's compiled. We add a few lines after three.js has
// worked out where the corner is ("begin_vertex"): push it sideways by a sine wave of the
// time. The wave also depends on where the corner is on the island, so neighbouring trees
// don't sway in step, and the corners of one tree move slightly differently, so it bends
// a little instead of sliding as one block.
//
// Only the shape moves: the shadows stay where they are, which is fine for a few cm.

// The time in seconds, shared by every swaying material. <Wind /> (Wind.tsx) updates it every frame.
export const windTime = { value: 0 }

const SWAY = /* glsl */ `
#include <begin_vertex>
{
  vec3 world = (modelMatrix * vec4(transformed, 1.0)).xyz;
  float phase = uWindTime * 1.4 + world.x * 0.15 + world.z * 0.12;
  float gust = 0.7 + 0.3 * sin(uWindTime * 0.35 + world.x * 0.02); // slowly stronger and weaker
  transformed.x += sin(phase) * 0.07 * gust;
  transformed.z += sin(phase * 0.8 + 1.3) * 0.045 * gust;
}
`

export function addSway(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.uWindTime = windTime
  shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader.replace('#include <begin_vertex>', SWAY)}`
}

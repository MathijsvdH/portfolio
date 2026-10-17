import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MODELS, type ModelName } from './modelList'
import { MODEL_COLORS } from './palette'

// Loads the 3D models (public/models/nature.glb, made by scripts/models.mjs) and turns each
// one into plain shapes in metres: one geometry per colour, standing on y = 0, the same
// { color, geometry } pieces the zones build their own shapes from. So a model can be drawn
// with <Model> (Model.tsx), merged into a zone's shapes, or copied many times with
// instancing.
//
// useGLTF loads a .glb file. It "suspends" while loading: React shows the nearest
// <Suspense> fallback until the file is there. The file is loaded once and shared.

const FILE = `${import.meta.env.BASE_URL}models/nature.glb`

export type ModelPart = { color: string; geometry: THREE.BufferGeometry }
export type Model = {
  parts: ModelPart[]
  size: THREE.Vector3 // width (x), height (y) and depth (z) in metres
}

// The baked models, per loaded file, so the work is done once.
const baked = new WeakMap<THREE.Object3D, Record<ModelName, Model>>()

export function useModels() {
  // false: no Draco decoder (the file is compressed with meshopt, whose decoder comes with drei).
  const { scene } = useGLTF(FILE, false)
  let models = baked.get(scene)
  if (!models) {
    models = bakeAll(scene)
    baked.set(scene, models)
  }
  return models
}

export function useModel(name: ModelName) {
  return useModels()[name]
}

// Start downloading as soon as the site loads, not when the first model is drawn.
useGLTF.preload(FILE, false)

function bakeAll(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true)
  const models = {} as Record<ModelName, Model>
  for (const name of Object.keys(MODELS) as ModelName[]) {
    const root = scene.getObjectByName(name)
    if (!root) throw new Error(`The model "${name}" isn't in nature.glb. Run scripts/models.mjs again.`)
    models[name] = bake(root, MODELS[name])
  }
  return models
}

// One model: collect its meshes, group them by colour, then scale it to `height` metres
// with its lowest point on y = 0. Its middle (x, z) stays where the kit put it: the trunk.
function bake(root: THREE.Object3D, height: number): Model {
  const byColor = new Map<string, THREE.BufferGeometry[]>()
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const material = child.material as THREE.Material
    const color = MODEL_COLORS[material.name] ?? '#ff00ff' // bright pink: a colour is missing in palette.ts
    const geometry = plainCopy(child.geometry)
    geometry.applyMatrix4(child.matrixWorld) // from the mesh's own coordinates into the file's
    byColor.set(color, [...(byColor.get(color) ?? []), geometry])
  })

  const parts = [...byColor].map(([color, list]) => ({ color, geometry: mergeGeometries(list) }))
  const box = new THREE.Box3()
  for (const { geometry } of parts) {
    geometry.computeBoundingBox()
    box.union(geometry.boundingBox!)
  }
  const scale = height / (box.max.y - box.min.y)
  for (const { geometry } of parts) {
    geometry.translate(0, -box.min.y, 0)
    geometry.scale(scale, scale, scale)
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
  }
  return { parts, size: box.getSize(new THREE.Vector3()).multiplyScalar(scale) }
}

// The file stores positions and normals as small whole numbers to save space (quantized),
// with a scale on the node to turn them back into real sizes. This copies them into plain
// decimal numbers, so the shape can be moved and scaled freely.
function plainCopy(source: THREE.BufferGeometry) {
  const geometry = new THREE.BufferGeometry()
  for (const name of ['position', 'normal']) {
    const attribute = source.getAttribute(name)
    const values = new Float32Array(attribute.count * attribute.itemSize)
    for (let i = 0; i < attribute.count; i++) {
      for (let k = 0; k < attribute.itemSize; k++) values[i * attribute.itemSize + k] = attribute.getComponent(i, k)
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize))
  }
  if (source.index) geometry.setIndex(source.index.clone())
  return geometry
}

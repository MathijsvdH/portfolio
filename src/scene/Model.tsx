import type { ThreeElements } from '@react-three/fiber'
import type { ModelName } from './modelList'
import { useModel } from './models'

type Props = ThreeElements['group'] & {
  model: ModelName
  glow?: number // hover highlight, like the zones' Paint material
}

// One model from the kit, in metres, standing on its group's origin. Put it inside a
// <Suspense>: it waits (shows nothing) until the model file has loaded.
export function Model({ model, glow = 0, ...props }: Props) {
  const { parts } = useModel(model)
  return (
    <group {...props}>
      {parts.map(({ color, geometry }) => (
        <mesh key={color} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color={color} emissive="#ffffff" emissiveIntensity={glow} flatShading roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

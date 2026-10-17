import { heightAt } from './islandShape'
import { Model } from './Model'
import { MODELS, type ModelName } from './modelList'
import { useModels } from './models'

// TEMPORARY, for checking the models: every model from modelList.ts in a row on the slope
// behind Home, at its real size, so sizes and colours can be compared with the island.
// Only shown with ?models in the address (http://localhost:5173/?models).
// Remove once the models are in use (step 13).

// Rows from the back to the front: tall trees, then middle-sized things, then small ones.
const ROWS = [
  { z: 68, from: 5 }, // models of 5 m and taller
  { z: 76, from: 1 },
  { z: 81, from: 0 },
]
const START_X = -66
const GAP = 1.5

export function ModelShelf() {
  const models = useModels()
  const ends = ROWS.map(() => START_X)
  const placed: { name: ModelName; x: number; z: number }[] = []
  for (const name of Object.keys(MODELS) as ModelName[]) {
    const row = ROWS.findIndex((r) => MODELS[name] >= r.from)
    const width = models[name].size.x
    placed.push({ name, x: ends[row]! + width / 2, z: ROWS[row]!.z })
    ends[row]! += width + GAP
  }
  return (
    <>
      {placed.map(({ name, x, z }) => (
        // Sunk 0.1 m, so it stands in the ground instead of on one corner.
        <Model key={name} model={name} position={[x, heightAt(x, z) - 0.1, z]} />
      ))}
    </>
  )
}

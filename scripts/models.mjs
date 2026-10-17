// Packs the models listed in src/scene/modelList.ts into one small file: public/models/nature.glb.
//
// Usage:
//   1. Download Kenney's Nature Kit (https://kenney.nl/assets/nature-kit) and unzip it
//      somewhere outside the project.
//   2. node scripts/models.mjs "<path to the unzipped kit>"
//
// What it does, with the gltf-transform command line tool (run once through npx, it isn't a
// dependency of the project):
//   merge    all listed models into one file, so the site downloads one file instead of 28
//   dedup    the kit's models share materials (same name, same colour): keep one of each
//   prune    drop what the site doesn't use (the texture coordinates: the kit has no textures)
//   meshopt  compress the geometry (the site decodes it with drei's useGLTF)

import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MODELS } from '../src/scene/modelList.ts'

const GLTF_TRANSFORM = 'npx --yes @gltf-transform/cli@4.5.1'
const OUTPUT = join(import.meta.dirname, '..', 'public', 'models', 'nature.glb')

const kit = process.argv[2]
if (!kit) {
  console.error('Usage: node scripts/models.mjs "<path to the unzipped Nature Kit>"')
  process.exit(1)
}
// Accept the kit's root folder or its "Models/GLTF format" folder.
const source = existsSync(join(kit, 'Models', 'GLTF format')) ? join(kit, 'Models', 'GLTF format') : kit

// Work on copies in a temporary folder, with short names, to keep the commands short.
const work = mkdtempSync(join(tmpdir(), 'models-'))
const names = Object.keys(MODELS)
for (const name of names) {
  const file = join(source, `${name}.glb`)
  if (!existsSync(file)) {
    console.error(`Not found in the kit: ${name}.glb`)
    process.exit(1)
  }
  copyFileSync(file, join(work, `${name}.glb`))
}

// "separate": each vertex attribute in its own buffer, which three.js reads most simply.
const run = (args) => execSync(`${GLTF_TRANSFORM} ${args} --vertex-layout separate`, { cwd: work, stdio: 'inherit' })
run(`merge ${names.map((n) => `${n}.glb`).join(' ')} merged.glb --merge-scenes`)
run('dedup merged.glb deduped.glb')
run('prune deduped.glb pruned.glb --keep-attributes false')
run(`meshopt pruned.glb "${OUTPUT}"`)
rmSync(work, { recursive: true })

console.log(`\n${names.length} models -> ${OUTPUT} (${(statSync(OUTPUT).size / 1024).toFixed(1)} KB)`)

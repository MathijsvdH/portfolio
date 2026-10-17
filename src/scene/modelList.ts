// The 3D models the site uses, and how tall each one is in real life, in metres.
//
// They come from Kenney's Nature Kit (CC0, https://kenney.nl/assets/nature-kit). The names
// are the kit's file names. `scripts/models.mjs` packs exactly these into one compressed
// file, public/models/nature.glb. To add a model: add its name here and run the script
// again (see the comment at the top of the script).
//
// The kit's models aren't to scale with each other, so each one gets its own height. The
// loader (models.ts) scales it to that height, keeping its proportions.
//
// No imports here: the script reads this file with plain Node.

export const MODELS = {
  // Palms, for the beaches
  tree_palmTall: 8,
  tree_palmDetailedTall: 8,
  tree_palmBend: 7,
  tree_palmShort: 5.5,

  // Leafy trees, for the meadow and the forest
  tree_default: 7,
  tree_oak: 6.5,
  tree_fat: 6,
  tree_detailed: 7,
  tree_tall: 8,

  // Pines, for the higher slopes
  tree_pineRoundA: 9,
  tree_pineTallA_detailed: 12,
  tree_cone: 8,

  // Stones and boulders
  stone_largeA: 1.1,
  stone_largeB: 1.1,
  stone_tallA: 2.5,
  stone_tallB: 2.5,
  stone_smallA: 0.5,
  stone_smallB: 0.5,

  // Bushes, grass and flowers
  plant_bush: 0.9,
  plant_bushDetailed: 1.2,
  plant_bushLarge: 1,
  grass: 0.45,
  grass_large: 0.45,
  flower_redA: 0.4,
  flower_yellowA: 0.4,
  flower_purpleA: 0.4,

  // Wood
  stump_round: 0.5,
  log_large: 0.6,
} as const

export type ModelName = keyof typeof MODELS

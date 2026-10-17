// All the scene's colours in one place, so the look stays consistent and is easy to tweak.
// Warm and bright, in the spirit of Wuhu Island.

export const PALETTE = {
  // Ground
  seabed: '#d4bc85',
  sand: '#f0dca0',
  grass: '#78b858',
  grassDark: '#57954a',
  rock: '#9a8a76',
  rockHigh: '#b8aea2',

  // Water: light turquoise in the shallows, deep blue further out, white foam
  waterShallow: '#3fd0c8',
  waterDeep: '#1a74c0',
  waterClear: '#1fbfe0', // the extra-clear water over the coral reef
  foam: '#ffffff',

  // Sky: the horizon colour is also the fog colour, so far things fade into the sky
  skyTop: '#3d8fe0',
  skyHorizon: '#cfe6f5',

  // Light
  sun: '#fff1d6', // slightly warm sunlight
  skyLight: '#bfe0ff', // light coming from the sky above
  groundLight: '#8a7a55', // light bouncing up from the ground
}

// Colours for the 3D models (models.ts), by the kit's material names. The kit's own colours
// are pastel (teal leaves, salmon wood), so they're swapped for these to match the island.
export const MODEL_COLORS: Record<string, string> = {
  leafsGreen: '#4f9e3a',
  leafsDark: '#3b7d3c', // pines
  grass: '#62a84a', // bushes, grass, flower stems
  woodBark: '#8a5a3a',
  woodBarkDark: '#6e4a34',
  woodInner: '#e3c493', // the cut face of stumps and logs
  stone: '#a39a8c',
  _defaultMat: '#a39a8c', // a few loose faces on some stones
  colorRed: '#e2483a',
  colorYellow: '#f5c234',
  colorPurple: '#a774e0',
}

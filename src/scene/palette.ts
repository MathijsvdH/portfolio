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

  // Water (refined in the water pass)
  water: '#2b9fd0',

  // Sky: the horizon colour is also the fog colour, so far things fade into the sky
  skyTop: '#3d8fe0',
  skyHorizon: '#cfe6f5',

  // Light
  sun: '#fff1d6', // slightly warm sunlight
  skyLight: '#bfe0ff', // light coming from the sky above
  groundLight: '#8a7a55', // light bouncing up from the ground
}

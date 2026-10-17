// Where everything sits on the island: one place for all positions.
// Real scale: 1 unit = 1 metre, sea level is y = 0.
// Map and directions: docs/roadmap.md. North is -z, east is +x, south is +z.
import type { ProjectId } from '../data/projects'
import { heightAt } from './islandShape'

export type Vec3 = [number, number, number]

// The spots at Home that the camera can fly up to: the welcome sign (about me), the notice
// board (skills and CV), the mailbox (contact) and the island map.
export const HOME_SPOTS = ['about', 'skills', 'contact', 'map'] as const
export type HomeSpot = (typeof HOME_SPOTS)[number]

// Somewhere the camera can be: a project zone, Home (the start view on the beach), or one
// of Home's spots. `null` is the overview of the whole island.
export type Place = ProjectId | 'home' | HomeSpot

export function isHomeSpot(place: Place | null): place is HomeSpot {
  return HOME_SPOTS.includes(place as HomeSpot)
}

// Is the camera at Home: the start view or one of its spots?
export function atHome(place: Place | null) {
  return place === 'home' || isHomeSpot(place)
}

export function isProject(place: Place | null): place is ProjectId {
  return place !== null && !atHome(place)
}

// A spot on the ground: looks up the height so things never float or sink.
function onGround(x: number, z: number): Vec3 {
  return [x, heightAt(x, z), z]
}

// Where the camera looks from (position) and at (target).
export type Viewpoint = { position: Vec3; target: Vec3 }

// Start view: from the south, looking at the whole island and the mountain.
export const OVERVIEW: Viewpoint = { position: [75, 135, 265], target: [0, 15, 0] }

export type ZoneLayout = {
  position: Vec3 // where the zone component is placed
  camera: Viewpoint // where the camera flies when the zone is opened (step 5)
}

// Internship has no zone yet (idea still open), so this is Partial.
// Free room for it later: south-west lowlands, or the mountain's shoulder.
// The coral reef follows the coast: a curved strip of sea around the island, between
// these angles (degrees, 0 = east, 90 = south) and distances (m) from the island's centre.
// The reef places its corals in it, and the water is extra clear over it.
export const REEF_AREA = { from: 26, to: 64, inner: 78, outer: 125 }

export const ZONES: Partial<Record<ProjectId, ZoneLayout>> = {
  // East beach: the jetty starts on the sand and runs 20 m due east out to sea.
  // At z = -10 the shore runs straight north-south, so due east is square to the beach.
  // Position is at sea level (y = 0), not on the ground: the jetty measures from the water.
  'knot-tying': {
    position: [104.5, 0, -10],
    camera: { position: [140, 14, 22], target: [112, 4, -8] },
  },
  // Shallow lagoon (1-2.5 m deep) in the south-east cove. The reef itself is a strip
  // along the coast (REEF_AREA below); this is its middle.
  // Position is at sea level (y = 0): the corals sit on the seabed below it.
  'coral-reef': {
    position: [74, 0, 74],
    camera: { position: [114, 38, 118], target: [70, -1.5, 70] },
  },
  // Meadow on the northern lowlands, above the sea cliffs.
  'animal-classification': {
    position: onGround(-12, -80),
    camera: { position: [-8, 32, -118], target: [-8, 21, -72] },
  },
  // Flat ground on the west headland.
  robotics: {
    position: onGround(-97, 9),
    camera: { position: [-105, 16.2, 14.5], target: [-97.2, 13.4, 8.6] },
  },
}

// Home: the welcome hut on the south arrival beach. The site starts here, on the beach.
// Not a project, so it's not in ZONES. Its spots' viewpoints are in src/zones/Home/spots.ts,
// because they follow the props' places on the beach.
export const HOME: ZoneLayout = {
  position: onGround(-24, 89),
  camera: { position: [-14.5, 9.2, 110.5], target: [-26.6, 3, 92] },
}

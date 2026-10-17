// Where everything sits on the island: one place for all positions.
// Real scale: 1 unit = 1 metre, sea level is y = 0.
// Map and directions: docs/roadmap.md. North is -z, east is +x, south is +z.
import type { ProjectId } from '../data/projects'
import { heightAt } from './islandShape'

export type Vec3 = [number, number, number]

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
export const ZONES: Partial<Record<ProjectId, ZoneLayout>> = {
  // East beach, the jetty goes ~20 m out into the water.
  'knot-tying': {
    position: onGround(104, 0),
    camera: { position: [150, 30, 45], target: [110, 0, 0] },
  },
  // Shallow lagoon (1-2 m deep) in the south-east cove.
  'coral-reef': {
    position: onGround(66, 66),
    camera: { position: [105, 35, 115], target: [66, -1, 66] },
  },
  // Meadow on the northern lowlands, above the sea cliffs.
  'animal-classification': {
    position: onGround(-12, -80),
    camera: { position: [-45, 60, -150], target: [-12, 18, -80] },
  },
  // Flat ground on the west headland.
  robotics: {
    position: onGround(-97, 9),
    camera: { position: [-160, 45, 45], target: [-97, 12, 9] },
  },
}

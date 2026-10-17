import { HOME, type HomeSpot, type Vec3, type Viewpoint } from '../../scene/layout'
import { HUT, groundY, hutFloor } from './parts'

// Where Home's clickable objects stand, and the camera viewpoints in front of them.
// Zone coordinates (see Home.tsx): +x is east, +z is south, towards the sea.
//
// `turn` is the rotation around y. A turn of 0 faces south (+z). Turned by `turn`, the
// front faces (sin turn, 0, cos turn).

// The start camera in zone coordinates. The props on the sand turn to face it.
const START: [number, number] = [HOME.camera.position[0] - HOME.position[0], HOME.camera.position[2] - HOME.position[2]]

function facingStart(x: number, z: number) {
  return Math.atan2(START[0] - x, START[1] - z)
}

export type Anchor = { x: number; z: number; turn: number }

// The welcome sign, east of the path: your name, tagline and About me.
export const SIGN_AT: Anchor = { x: 3, z: 9, turn: facingStart(3, 9) }
export const SIGN = { width: 2.8, height: 1.75, bottom: 0.75 }

// The island map on a stand, west of the path, near the water.
export const MAP_AT: Anchor = { x: -2.9, z: 11.3, turn: facingStart(-2.9, 11.3) }
export const MAP = { width: 2.4, height: 2.08, bottom: 0.55 }

// The mailbox with the "Find me" board under it, by the porch steps.
export const CONTACT_AT: Anchor = { x: -1.7, z: 6.3, turn: facingStart(-1.7, 6.3) }
export const CONTACT = { width: 1.1, height: 0.62, bottom: 0.3 }

// The notice board on the hut's front wall, right of the door (`bottom` is above the floor).
export const BOARD_AT: Anchor = { x: 1.5, z: HUT.depth / 2 + 0.03, turn: 0 }
export const BOARD = { width: 1.7, height: 1.35, bottom: 0.55 }

// For each spot: the middle of what to look at (zone coordinates), which way it faces,
// and how far back the camera stands.
function spotTarget(spot: HomeSpot, origin: Vec3): { centre: Vec3; turn: number; distance: number } {
  const ground = (a: Anchor) => groundY(origin, a.x, a.z)
  switch (spot) {
    case 'about':
      return { centre: [SIGN_AT.x, ground(SIGN_AT) + SIGN.bottom + SIGN.height / 2, SIGN_AT.z], turn: SIGN_AT.turn, distance: 4.4 }
    case 'map':
      return { centre: [MAP_AT.x, ground(MAP_AT) + MAP.bottom + MAP.height / 2, MAP_AT.z], turn: MAP_AT.turn, distance: 3.4 }
    case 'contact':
      return { centre: [CONTACT_AT.x, ground(CONTACT_AT) + 0.72, CONTACT_AT.z], turn: CONTACT_AT.turn, distance: 1.8 }
    case 'skills':
      return { centre: [BOARD_AT.x, hutFloor(origin) + BOARD.bottom + BOARD.height / 2, BOARD_AT.z], turn: 0, distance: 2.8 }
  }
}

// Where the name tags float at the start view (world coordinates): over each object.
// They're HTML buttons (src/ui/HomeLabels.tsx), kept in place by ScreenAnchors.
export function homeLabels(origin: Vec3 = HOME.position): { spot: HomeSpot; text: string; at: Vec3 }[] {
  const [ox, oy, oz] = origin
  const above = (a: Anchor, height: number): Vec3 => [ox + a.x, oy + groundY(origin, a.x, a.z) + height, oz + a.z]
  const floor = hutFloor(origin)
  return [
    { spot: 'about', text: 'About me', at: above(SIGN_AT, SIGN.bottom + SIGN.height + 0.9) },
    { spot: 'skills', text: 'Skills & CV', at: [ox + BOARD_AT.x, oy + floor + BOARD.bottom + BOARD.height + 0.3, oz + BOARD_AT.z + 0.3] },
    { spot: 'contact', text: 'Contact', at: above(CONTACT_AT, 1.75) },
    { spot: 'map', text: 'Island map', at: above(MAP_AT, MAP.bottom + MAP.height + 0.7) },
  ]
}

// The camera viewpoint for the start view or a spot, in world coordinates. The camera
// stands in front of the object and a little higher, looking slightly down at it.
export function homeView(spot: 'home' | HomeSpot, origin: Vec3 = HOME.position): Viewpoint {
  if (spot === 'home') return HOME.camera
  const { centre, turn, distance } = spotTarget(spot, origin)
  const [x, y, z] = centre
  const [ox, oy, oz] = origin
  return {
    position: [ox + x + Math.sin(turn) * distance, oy + y + distance * 0.22, oz + z + Math.cos(turn) * distance],
    target: [ox + x, oy + y, oz + z],
  }
}

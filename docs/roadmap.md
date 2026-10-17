# Roadmap

From the round placeholder island to a real-size island in the style of Wii Sports
Resort's Wuhu Island, where every project has its own section.

One step per session. Every step ends with `npm run build` passing and a screenshot.

## Scale: real size
1 unit = 1 metre. Things are life-size, like on Wuhu Island: a boat you could sail,
a fishing cabin you could walk into. A rocky mountain towers over everything.

| Thing | Size |
|---|---|
| Island | ~240 m across |
| Mountain | ~90 m tall, ~70 m base radius, rocky, no crater |
| Fishing cabin | ~6 × 5 m, ~5 m tall |
| Boat | ~8 m long, jetty ~20 m |
| Each zone | ~40–50 m of room on the lowlands around the mountain |

The ground is a natural landscape (slopes, rolling lowlands, rocky coast), not flat terraces.

## What makes "that look"
1. **Shape**: a real landscape: big mountain, rolling lowlands, beaches, rocky coast in places.
2. **Colour & light**: a small warm palette, soft sky light, fog that hides the far sea.
3. **Water**: light turquoise in the shallows, darker further out, foam at the shore, gentle waves.
4. **Props**: many trees/rocks/flowers (cheap through instancing).
5. **Life**: things move a little (trees sway, boat bobs, birds, fish).
6. **Sections**: each zone has its own landmark you can recognise from the overview.

## Map (top view, camera starts from the south)
```
                 N
        ┌─────────────────────┐
        │   🌳🦌 Wildlife     │   north: meadow/forest, rocky sea cliffs
        │                     │
   W    │ 🤖 Robot    ⛰️      │ ⛵ Boat    E
        │ (west      mountain │ jetty on east beach
        │  headland)          │
        │   🏠 Home  🏖️ beach │ 🐠 Reef (shallow lagoon in SE cove)
        └─────────────────────┘
                 S  ← overview camera
```
- Rocky mountain in the middle. The zones sit on the lowlands around it, so the
  mountain separates the sections.
- **Home** on the south arrival beach (welcome hut or lighthouse, to decide): opens
  About me, Socials & contact, CV and Skills. It's the first thing visitors see.

## Personal info (not a project)
Besides the projects, the site has the usual portfolio things:
- **About me**, **Socials & contact**, **CV download** (PDF), **Skills & tools**.
- Reachable in two ways: an always-visible **corner menu** (social icons, About,
  Skills, CV, and a **project list** that flies the camera to a zone), and the **Home**
  place on the island.
- A **simple text version** of the site (no 3D, same content) for slow phones,
  recruiters in a hurry and search engines.
- Content goes in `src/data/profile.ts` (like `projects.ts`), with TODOs instead of
  invented details.
- **Internship zone: idea still open**, and no spot reserved. There is room on the
  south-west lowlands or on the mountain's shoulder. `src/scene/layout.ts` keeps all zone
  positions in one place, so adding a zone later is a small change.

## Steps

**A. Foundation**
- [x] 1. **Docs**: this roadmap, answers in `zones.md`, decisions logged.
- [x] 2. **Real-size terrain**: heightmap island (mountain, lowlands, beaches, cove,
  headland) in `src/scene/islandShape.ts` with `heightAt(x, z)`; colours from height and
  steepness. Zone positions and camera viewpoints in `src/scene/layout.ts`. Sea, camera
  range and shadow area resized to the bigger world. Check scale with life-size markers.
  *(First try with small stacked terraces was too small: a person was as tall as the hill.)*
  Result: island ~240 m, peak ~88 m. Good enough for now; may get minor tweaks later.
- [x] 3. **Look pass**: colours in `src/scene/palette.ts`, `hemisphereLight` + warm sun,
  painted gradient sky with matching fog (`src/scene/SkyAndFog.tsx`, replaces drei `Sky`),
  Neutral tone mapping so colours stay bright, shadow type fixed.
- [x] 4. **Water pass**: own water shader (`src/scene/Water.tsx`): turquoise and
  see-through in the shallows, deep blue further out, a foam line at the shore with foam
  bands rolling in, and drifting ripple lines, animated with `useFrame`. Depth comes from
  a small depth map baked once from `terrainHeight()`. The water surface stays flat (no
  moving geometry), which keeps it cheap.

**B. Navigation & menu**
- [x] 5. **Fly-to camera**: drei `CameraControls` instead of `OrbitControls`
  (`src/scene/CameraRig.tsx`). The selected zone drives the camera to its viewpoint from
  `layout.ts`, in an arc that stays 20 m above the ground (so it never flies through the
  mountain). "Back to island" button. Temporary marker posts (`src/scene/ZoneMarkers.tsx`)
  stand in for the zones until they're built. On narrow phone screens the camera steps back
  so the island fits.
- [x] 6. **Corner menu**: always-visible 2D menu with social icons, About me, Skills &
  tools, CV download, and a project list that flies to each zone. New
  `src/data/profile.ts` for the personal content (TODOs).
  Built in `src/ui/CornerMenu.tsx` (top-left; name and social icons always visible, the
  rest behind the ☰ button) with inline SVG icons in `src/ui/SocialIcon.tsx`. Socials
  without a link are greyed out, the CV shows "coming soon" until `cvUrl` is set. On
  screens under 700 px the menu hides while a project panel is open.
  Animations (plain CSS in `src/index.css`): the menu grows downwards, ☰ morphs into ✕,
  the project panel and back button fade/slide in and out, fold-outs open smoothly. Turned
  off for visitors with "reduce motion" on.

**C. Places** (one step each, `new-zone` skill, simple shapes first, life-size)
- [x] 7. Boat + jetty. First version in `src/zones/Boat/Boat.tsx`: a 20 m jetty from the
  east beach (z = -10, where the shore runs straight north-south) due east out to sea, posts
  down to the seabed, and a ~9.5 m sailboat (13.6 m mast, curved sails, rigging, railing,
  fenders, three mooring lines) on the south side. Fishing gear around it: nets drying on a
  rack, a net pile, crates, a line of floats. Invisible hitboxes make the gaps clickable too.
  Split into `Jetty`, `Sailboat`, `FishingGear`, shared sizes/helpers in `parts.ts`.
  Good for now; may get tweaks once the other zones exist.
- [x] 8. Coral reef. First version in `src/zones/CoralReef/CoralReef.tsx`: a strip of nine
  reef patches along the SE coast (`REEF_AREA` in `layout.ts`: 26-64 degrees around the
  island), each placed where the water is 1-2.5 m deep, with sandy channels between them.
  Brain, branching and table coral, tube sponges, sea fans, sea grass and starfish, scattered
  with a fixed random seed and merged into one mesh per colour. Rocks break the surface by the
  shore, and a dive raft with a "diver down" flag floats by the reef. The water is extra clear
  (and a bit bluer) over the same strip, so the colours show through (`uClearArc` in `Water.tsx`).
  Good for now; may get tweaks once the other zones exist.
- [x] 9. Wildlife. First version in `src/zones/Wildlife/Wildlife.tsx`: a meadow on the
  northern plateau (~17 m up, above the sea cliffs), ringed by pines and leafy trees on the
  west, south and east, open to the north so the camera looks in from over the sea. Life-size
  animals from simple shapes (`animals.ts`): a stag with antlers, a grazing doe, a fox, three
  rabbits, a hedgehog and two robins on a fallen log. Wild flowers, rocks, and a trail camera
  strapped to a tree, aimed at the deer. Scattered with a fixed seed and merged into one mesh
  per colour. Hover/click through `useZoneHover` on an invisible sheet draped over the meadow
  and forest. The animals stand still for now (movement is step 15).
  `useZoneHover` now also checks the line of sight with `heightAt`, so a zone can't be
  hovered or clicked through the mountain (R3F doesn't let the island block the pointer).
- [x] 10. Robot corner. First version in `src/zones/RobotCorner/RobotCorner.tsx`: a small
  workshop on a concrete pad on the west headland plateau. An open wooden shed (workbench
  with laptop, toolbox and a pegboard of tools, a shelf of bins) and in front of it two test
  stations side by side, each with its own colour (blue and orange tape): a table with a robot
  arm, blocks to pick up and a tray to place them in, for comparing ACT and flow matching on
  the same task. Both stations show the same state (one block placed, one dropped), so the
  scene doesn't claim a result. The arm (`RobotArm.tsx`) is a chain of nested joint groups,
  posed with inverse kinematics (`armPose.ts`), so step 15 can move it every frame.
  Hitboxes: a slab over the pad and a box around the shed, kept low because the zone camera
  stands low.
- [x] 11. Home on the south beach, where the site starts. `src/zones/Home/`: a mint beach
  hut on stilts (coral roof, porch, steps, boardwalk to the sea) with deck chairs, a parasol,
  a fire pit, a surfboard and palms. First try (a small hut that opened an About panel) felt
  like a copy of the corner menu and was easy to miss, so it was reworked:
  - **Start on the beach**: the page opens low on the Home beach (`HOME.camera` in
    `layout.ts`), not on the overview. The bottom button changes with where you are:
    "Explore the island ↑" (beach → overview), "← Back to island" (zone → overview),
    "⌂ Back to the beach" (overview → beach). The corner menu has a Home entry too.
  - **The objects are the content**, painted with canvas textures from `profile.ts`
    (`textures.ts`, no image or font files): the welcome sign (name, tagline, About me), the
    notice board on the hut (skills as notes, a CV sheet to click and download), the mailbox
    with a "Find me" board of postcards (one per social link, click to open). Clicking an
    object flies the camera up to it (`spots.ts`: the spots `about`, `skills`, `contact`, `map`).
  - **Island map**: a board painted from the real terrain (`heightAt`), north up, with a 3D
    pin and name tag per zone and "You are here". Click a pin to fly to that zone.
  - Name tags over the four objects at the start view: HTML buttons (`src/ui/HomeLabels.tsx`)
    kept over their 3D spots by `src/scene/ScreenAnchors.tsx`. (drei `Html` threw a
    `removeChild` error on unmount with React 19, so it isn't used.)
  - From far away the whole beach is one hitbox that flies back to the start view.
    `useZoneHover` got an `enabled` flag for this. Short camera hops (between spots) stay
    low, and the zoom limit follows the view, so scrolling at a close-up doesn't jump out.
- [ ] Internship zone: extra step once the idea is decided.

**D. Make it pretty**
- [x] 12. **Model pipeline**: Kenney's Nature Kit (CC0), 28 models packed into one file,
  `public/models/nature.glb` (294 KB → 100 KB).
  - `src/scene/modelList.ts`: which models, and each one's real height in metres.
  - `scripts/models.mjs`: packs exactly those with gltf-transform (run once via npx, not a
    dependency): merge, dedup, prune, meshopt compression. Run it again after editing the list.
  - `src/scene/models.ts`: `useModels()` / `useModel(name)` load the file with drei `useGLTF`
    and bake each model into `{ color, geometry }` parts in metres, standing on y = 0 (the
    same shape as the zones' `Pieces`). The kit's materials (metallic, pastel colours) are
    swapped for `MODEL_COLORS` in `palette.ts`. `<Model model="tree_oak" />` draws one.
  - Temporary check: `/?models` lines all models up behind Home (`ModelShelf.tsx`).
    Remove it in step 13.
  - Credits: README and `public/models/LICENSE-kenney-nature-kit.txt`.
- [ ] 13. **Nature scatter**: trees, rocks, flowers with drei `Instances`, placed with
  `heightAt`; zones kept clear. **Postponed to the end:** a first try (rules from the
  ground colours, ~730 items, plain `InstancedMesh`) was reverted on 2026-10-18; Mathijs
  didn't like the look. Revisit once the zones are upgraded.
- [ ] 14. **Zone upgrades**: placeholder shapes → models, one zone per step.
  - [x] Wildlife: the forest ring (60 trees: kit pines and leafy trees), rocks, flower
    clumps with grass, and the fallen log (the kit's log stretched to 4.5 m) are kit
    models, merged into the zone's meshes like its own shapes, so the hover glow still
    works. Helpers in `src/zones/Wildlife/parts.ts`: `model()` adds a model,
    `trunkRadius()` measures the camera tree's trunk so the trail camera's strap fits.
    Animals and the trail camera stay hand-built (the kit has none). Wrapped in
    `<Suspense>` in `App.tsx`, because it waits for the model file.
- [x] 15. **Life**: things move, all with `useFrame` (runs every frame) changing objects
  directly, so nothing re-renders.
  - Robot arms (`RobotCorner/armTask.ts`): both loop pick → carry → place in the tray, then
    the old block shrinks away and a new one grows in. About 3 in 10 tries the block slips
    and drops on the table; same odds for both arms, out of step, so neither looks better.
    The task is a pure function of time, so the arm (`RobotArm.tsx`, joints turned by refs)
    and its block (`TaskBlock`) always agree. Poses come from the existing `reach()`.
  - Floating: `src/scene/Bobbing.tsx` makes the sailboat and the dive raft rise, sink and
    rock a little (small for the boat: its mooring lines are fixed).
  - Wind: `src/scene/sway.ts` adds a few shader lines (`onBeforeCompile`) that push leaf
    corners back and forth; `Wind.tsx` runs its clock. Used for the Wildlife trees' leaves
    and Home's palm leaves (`Paint` got a `sway` option). Shadows don't sway.
  - Birds (`src/scene/Birds.tsx`): seagulls circling in three small flocks (over Home, low
    enough for the start view; over the boat; high over the south coast), leaning into the
    turn, flapping then gliding.
  - Fish (`CoralReef/Fish.tsx`): six schools swimming loops over the reef, one
    `InstancedMesh` with a colour per fish. Slightly bigger than real, to be seen from above.
  - Animals (`Wildlife/MeadowAnimals.tsx`): out of the meadow's merged mesh, each its own
    group. The doe grazes and looks up (neck and head are separate joints), the stag looks
    around, the fox swishes its tail, rabbits hop in small circles, robins hop and turn on
    the log, the hedgehog shuffles about. Their places moved to `Wildlife/spots.ts`.
- [ ] 16. **Labels**: hover name tags (with `ScreenAnchors`, like Home's tags), small signposts.

**E. Polish & ship**
- [ ] 17. Loading screen (drei `useProgress`).
- [ ] 18. Phone pass: lower `dpr`/shadows on small screens, terrain detail, touch check, panel layout.
- [ ] 19. **Simple text version**: a plain page (no 3D) built from the same data files,
  linked from the corner menu.
- [ ] 20. Content: fill `src/data/projects.ts` and `src/data/profile.ts` (text, images,
  links, social handles, CV PDF).
- [ ] 21. Deploy (pick a host then).

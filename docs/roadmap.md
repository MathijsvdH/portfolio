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
        │        🏖️ beach     │ 🐠 Reef (shallow lagoon in SE cove)
        └─────────────────────┘
                 S  ← overview camera
```
- Rocky mountain in the middle. The zones sit on the lowlands around it, so the
  mountain separates the sections.
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
- [ ] 3. **Look pass**: palette, `hemisphereLight`, fog that hides the edge of the sea,
  shadows tuned for the big area.
- [ ] 4. **Water pass**: shallow/deep colours, shore foam, a small wave shader animated
  with `useFrame`.

**B. Navigation**
- [ ] 5. **Fly-to camera**: drei `CameraControls` instead of `OrbitControls`. The selected
  zone drives the camera to its viewpoint from `layout.ts`. "Back to island" button.

**C. Zones** (one step each, `new-zone` skill, simple shapes first, life-size)
- [ ] 6. Boat + jetty
- [ ] 7. Coral reef
- [ ] 8. Wildlife
- [ ] 9. Robot corner
- [ ] Internship zone: extra step once the idea is decided.

**D. Make it pretty**
- [ ] 10. **Model pipeline**: one Kenney/Quaternius pack, compressed, loaded with drei
  `useGLTF`, in `public/models/`, with credits. Scale models to metres.
- [ ] 11. **Nature scatter**: trees, rocks, flowers with drei `Instances`, placed with
  `heightAt`; zones kept clear.
- [ ] 12. **Zone upgrades**: placeholder shapes → models, one zone per step.
- [ ] 13. **Life**: sway, bobbing, birds, fish, the robot trying and failing (`useFrame`).
- [ ] 14. **Labels**: hover name tags with drei `Html`, small signposts.

**E. Polish & ship**
- [ ] 15. Loading screen (drei `useProgress`).
- [ ] 16. Phone pass: lower `dpr`/shadows on small screens, terrain detail, touch check, panel layout.
- [ ] 17. Content: fill `src/data/projects.ts` (text, images, links).
- [ ] 18. Deploy (pick a host then).

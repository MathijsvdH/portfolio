# Roadmap

From the round placeholder island to a small, cosy island in the style of Wii Sports
Resort's Wuhu Island and Animal Crossing, where every project has its own section.

One step per session. Every step ends with `npm run build` passing and a screenshot.

## What makes "that look"
1. **Shape**: irregular coastline + flat terraces/cliffs (Animal Crossing levels), not a cylinder.
2. **Colour & light**: a small warm palette, soft sky light, light fog, flat-shaded materials.
3. **Water**: light turquoise in the shallows, darker further out, foam at the shore, gentle waves.
4. **Props**: many small trees/rocks/flowers (cheap through instancing).
5. **Life**: things move a little (trees sway, boat bobs, birds, fish).
6. **Sections**: each zone has its own landmark you can recognise from the overview.

## Map (top view, camera starts from the south)
```
                 N
        ┌─────────────────────┐
        │   🌳🦌 Wildlife     │   north: forest + meadow
        │   (meadow/forest)   │
   W    │ 🤖 Robot   ⛰️ ?     │ ⛵ Boat    E
        │ (rocky     open     │ jetty on east beach
        │  plateau)  hilltop  │
        │        🏖️ beach     │ 🐠 Reef (shallow lagoon, SE)
        └─────────────────────┘
                 S  ← overview camera
```
- Hill in the centre (highest tier). The hilltop stays **open** for now.
- Sections are split by the hill, cliffs and paths, so each one reads as its own place.
- **Internship zone: idea still open.** The open hilltop is a free spot for it later.
  `src/scene/layout.ts` (step 2) keeps all zone positions in one place, so adding a
  zone later is a small change.

## Steps

**A. Foundation**
- [x] 1. **Docs**: this roadmap, answers in `zones.md`, decisions logged.
- [ ] 2. **Island shape**: 3 terraces (beach, grass, hill) from an irregular `THREE.Shape`
  + `ExtrudeGeometry`. Add `src/scene/layout.ts` with every zone's position + camera viewpoint.
- [ ] 3. **Look pass**: palette constants, `hemisphereLight`, fog, flat shading, shadow
  area fitted to the island.
- [ ] 4. **Water pass**: shallow/deep colours, shore foam, a small wave shader animated
  with `useFrame`.

**B. Navigation**
- [ ] 5. **Fly-to camera**: drei `CameraControls` instead of `OrbitControls`. The selected
  zone drives the camera to its viewpoint from `layout.ts`. "Back to island" button.

**C. Zones** (one step each, `new-zone` skill, simple shapes first)
- [ ] 6. Boat + jetty
- [ ] 7. Coral reef
- [ ] 8. Wildlife
- [ ] 9. Robot corner
- [ ] Internship zone: extra step once the idea is decided.

**D. Make it pretty**
- [ ] 10. **Model pipeline**: one Kenney/Quaternius pack, compressed, loaded with drei
  `useGLTF`, in `public/models/`, with credits.
- [ ] 11. **Nature scatter**: trees, rocks, flowers with drei `Instances`; zones and hilltop kept clear.
- [ ] 12. **Zone upgrades**: placeholder shapes → models, one zone per step.
- [ ] 13. **Life**: sway, bobbing, birds, fish, the robot trying and failing (`useFrame`).
- [ ] 14. **Labels**: hover name tags with drei `Html`, small signposts.

**E. Polish & ship**
- [ ] 15. Loading screen (drei `useProgress`).
- [ ] 16. Phone pass: lower `dpr`/shadows on small screens, touch check, panel layout.
- [ ] 17. Content: fill `src/data/projects.ts` (text, images, links).
- [ ] 18. Deploy (pick a host then).

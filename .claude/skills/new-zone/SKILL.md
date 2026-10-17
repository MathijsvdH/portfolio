---
name: new-zone
description: Add a new project zone to the 3D island. Use when the user asks to add, create or start a zone or a project location on the island.
---

# New zone

Add one zone to the island, following the zone convention in CLAUDE.md.

## Steps
1. **Read** `docs/zones.md` for the zone's idea, and `src/data/projects.ts` for its content.
2. **Plan first.** Before writing code, tell the user in a few lines:
   - where on the island it goes (position)
   - what it looks like as a first version (simple shapes are fine)
   - what happens on hover and click
   Wait for approval.
3. **Create** `src/zones/<ZoneName>/<ZoneName>.tsx`:
   - Props: `position` and `onSelect: (id: ProjectId) => void`.
   - Starts as a placeholder built from simple geometry or drei shapes. Real models come later.
   - Hover: cursor becomes a pointer (drei `useCursor`) and the zone highlights slightly.
   - Click: calls `onSelect('<project-id>')`. Stop event propagation so clicks don't hit zones behind it.
4. **Add content** for the project in `src/data/projects.ts` if it's missing. Use placeholder text marked `TODO` instead of inventing project details.
5. **Place it** in `src/App.tsx` inside the Canvas, passing `onSelect={setSelected}`.
6. **Verify:** run `npm run build`. Then open the dev server with the browser tool, take a screenshot, and check the zone is visible and the panel opens on click.
7. **Update** the zone's status in `docs/zones.md` (`placeholder` or `done`).

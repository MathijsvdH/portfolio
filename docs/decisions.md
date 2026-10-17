# Decisions

Why things are the way they are. Newest on top. Add an entry when choosing between real alternatives (a library, an approach, a structure), not for small things.

Format:
```
## YYYY-MM-DD: decision
**Context:** what problem needed solving
**Options:** what was considered
**Choice:** what was picked and why
```

---

## 2026-10-17: real-size world with heightmap terrain
**Context:** The first island (stacked flat terraces, ~22 m across) was a tabletop model: a person-sized marker was as tall as the hill. The goal is a Wuhu Island feel with life-size things (boat, fishing cabin) and a mountain that towers above everything.
**Options:** Keep the small diorama and scale objects down; taller stacked terraces (`ExtrudeGeometry`); a heightmap terrain at real scale.
**Choice:** Real scale (1 unit = 1 m, island ~240 m, rocky mountain ~90 m) with a heightmap: a grid whose points are lifted by a height formula. Stacked terraces look like a cake at this height, a heightmap gives natural slopes, and `heightAt(x, z)` lets everything be placed exactly on the ground. Regular rocky mountain, no volcano crater.

## 2026-10-17: free CC0 low-poly model packs for the art
**Context:** The island needs a cosy, Animal Crossing / Wuhu Island look (trees, rocks, boat, robot, animals).
**Options:** Build everything from three.js primitives in code; free CC0 packs (Kenney.nl, Quaternius); model own assets in Blender.
**Choice:** CC0 packs. They look good immediately, are small and fast, and need no new npm packages. Models get compressed before going into `public/models/`. Simple primitives are still used for first placeholder versions of zones.

## 2026-10-17: click a zone, camera flies there
**Context:** Needed a way for visitors to move around the island and reach projects.
**Options:** Free orbit camera only; click a zone and the camera glides there (like the Wii Sports Resort island menu); a walking character (like Animal Crossing).
**Choice:** Click-to-fly with drei `CameraControls`. Simplest to build, works well on phones, and gets visitors to the projects fastest. A walking character could be added later as an optional mode.

## 2026-10-16: AI-assisted development with Claude Code
**Context:** Hand-coding the 3D site in R3F was slow, and the grant goal is a complete interactive island.
**Options:** Keep hand-coding; prompt a chat LLM and paste code; use an agent (Claude Code) in the repo with rules in files.
**Choice:** Claude Code with CLAUDE.md, skills and an auto-updated devlog. Rules in files keep the agent consistent between sessions, and the devlog documents the process for the portfolio.

## 2026-10-16: island as the site concept
**Context:** Needed one 3D world that can hold very different projects.
**Options:** Separate scenes per project; a gallery/room; an island.
**Choice:** An island, because most projects fit naturally (reef, boat, wildlife) and the harder ones (robotics, internship) can be a robot corner and a mirror.

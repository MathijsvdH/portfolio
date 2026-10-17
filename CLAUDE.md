# Island Portfolio: instructions for Claude

## What this is
Mathijs's portfolio website, rebuilt as an interactive 3D island. Each project
has its own place (a "zone") on the island. Visitors explore the island and
click a zone to read about that project. This is a grant project.

Full zone list and status: `docs/zones.md`.

## Stack
- Vite 8 + React 19 + TypeScript
- three.js, React Three Fiber (`@react-three/fiber` v9) for the 3D scene
- drei (`@react-three/drei` v10) for helpers (OrbitControls, Sky, Html, loaders)
- oxlint for linting

## Commands
- `npm run dev`: dev server at http://localhost:5173
- `npm run build`: typecheck + production build. Must pass before a task counts as done.
- `npm run typecheck`: typecheck only
- `npm run lint`: lint

A hook runs the typecheck automatically after every .ts/.tsx edit. If it
reports errors, fix them before moving on.

## Project structure
```
src/
  App.tsx              Canvas, camera, controls, which panel is open
  scene/               Island-wide things: Island, Water, Lighting
  zones/               One folder per project zone
  ui/ProjectPanel.tsx  2D overlay shown when a zone is clicked
  data/projects.ts     Text content for every project
public/models/         .glb models (create when the first model is added)
docs/                  devlog, decisions, zones
```

### Zone convention
Every zone lives in `src/zones/<ZoneName>/<ZoneName>.tsx` and exports one component:
- Props: `position` and `onSelect: (id: ProjectId) => void`
- On click it calls `onSelect` with its project id. App opens the panel.
- Content comes from `src/data/projects.ts`, never hardcoded in the zone.
- Zones never import from each other. Shared things go in `src/scene/`.

Use the `new-zone` skill when adding a zone.

## Seeing the scene
A Playwright browser tool is configured in `.mcp.json`. After visual changes,
start the dev server, open http://localhost:5173 and take a screenshot to check
the result. Don't claim something looks right without looking.

## Rules
1. **Small steps.** One thing per task. If a request is big, propose a plan and
   split it into steps before writing code.
2. **No new dependencies without asking.** Say which package and why.
3. **Keep it fast.** It must run on a laptop and a phone. Prefer simple geometry
   and drei helpers over heavy models. Compress models. No post-processing
   without asking.
4. **Content lives in data.** Project text goes in `src/data/projects.ts`.
   Don't invent project details; leave TODOs.
5. **Verify before saying done.** `npm run build` passes, and look at the scene.
6. **Explain 3D choices briefly.** Mathijs is learning R3F. When you use a new
   concept (useFrame, instancing, shaders, raycasting) add one line on what it does.
7. **Log your work.** At the end of a session, run the `wrapup` skill.

## Do not
- Rewrite working code that wasn't part of the task.
- Delete files without asking.
- Put secrets or API keys in the code.
- Commit, push or create pull requests. Only Mathijs makes git commits.
  When work is ready, say so and stop.
- Add Claude as a co-author, collaborator or contributor anywhere: no
  `Co-Authored-By` lines, no "Generated with Claude Code" footers, no credits
  in commit messages, PRs, README or package.json.

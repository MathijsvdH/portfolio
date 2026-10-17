# Island zones

Each project gets a place on the island. Update the status column as zones get built.

| Zone | Project | Idea | Status |
|---|---|---|---|
| Island base | (none) | Real-size terrain with a rocky mountain, water, sky, camera controls | in progress |
| Coral reef | Coral reef project | Reef in the shallow lagoon of the south-east cove | placeholder |
| Boat | Knot-tying project | Life-size boat (~8 m) at a jetty on the east beach, rope and knots on deck; maybe a fishing cabin | placeholder |
| Wildlife | Animal classification | Life-size animals in the northern meadow/forest, maybe with labels when you hover | todo |
| Robot corner | Robotics project | A robot at a workshop on the west headland that is visibly "learning" (trying, failing, improving) | todo |
| (open) | Internship | Idea still open, to decide. No spot reserved yet | todo |
| Home | (personal info, not a project) | Welcome hut or lighthouse on the south arrival beach. Opens About me, Socials & contact, CV, Skills & tools. Same content as the corner menu | todo |

Everything is life-size (1 unit = 1 metre). See the scale table in `docs/roadmap.md`.

Status values: `todo`, `in progress`, `placeholder` (works, but simple shapes), `done`.

## Answered
- **Where does each zone sit?** See the map in `docs/roadmap.md`: rocky mountain in
  the middle, Wildlife north, Boat at a jetty on the east beach, Coral reef in the
  south-east cove, Robot corner on the west headland.
- **How does a visitor move?** Click a zone and the camera flies there; a "Back to
  island" button returns to the overview. (See `docs/decisions.md`.) Built in step 5; until a
  zone exists, a temporary marker post stands at its spot.

## Open questions
- What is the internship zone's idea? (The mirror is dropped for now.)
- Home: welcome hut or lighthouse?
- Which socials exist (GitHub, LinkedIn, Instagram, ...)? And the CV PDF.
- What does the project panel show: text, images, video, links?

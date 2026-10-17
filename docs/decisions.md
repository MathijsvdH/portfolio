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

## 2026-10-16: AI-assisted development with Claude Code
**Context:** Hand-coding the 3D site in R3F was slow, and the grant goal is a complete interactive island.
**Options:** Keep hand-coding; prompt a chat LLM and paste code; use an agent (Claude Code) in the repo with rules in files.
**Choice:** Claude Code with CLAUDE.md, skills and an auto-updated devlog. Rules in files keep the agent consistent between sessions, and the devlog documents the process for the portfolio.

## 2026-10-16: island as the site concept
**Context:** Needed one 3D world that can hold very different projects.
**Options:** Separate scenes per project; a gallery/room; an island.
**Choice:** An island, because most projects fit naturally (reef, boat, wildlife) and the harder ones (robotics, internship) can be a robot corner and a mirror.

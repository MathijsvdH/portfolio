---
name: wrapup
description: End-of-session documentation. Use when the user says wrap up, done for today, end session, or asks to update the devlog.
---

# Wrap up

Record what happened this session so the next session (and the portfolio) has it.

## Steps
1. **Collect** what changed: run `git status` and `git diff --stat`, and look back over this session.
2. **Devlog:** add a new entry at the top of `docs/devlog.md` (below the format block) with today's date, in the format shown there. Keep it short: Done, Problems, Next.
3. **Decisions:** if a real choice was made between alternatives this session, add an entry to `docs/decisions.md`. Skip this if nothing qualifies.
4. **Zones:** update statuses in `docs/zones.md` if a zone changed.
5. **CLAUDE.md:** if a new convention or rule came up (something the user corrected more than once), propose adding it. Ask before editing.
6. **Commit:** suggest a commit message summarizing the session. Ask before committing.

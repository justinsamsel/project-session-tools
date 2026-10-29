# Next Session Primer

Generate `context/prompts/next-session/latest.md` after a wrap-up that changed BRIEF, STATUS, or DECISIONS.

This file is the generation contract only. Resume detection, Fast/Deep, and builder handoff live in `resume-experience.md` (one file). They are not part of wrap-up.

## Template

```
You are working on [Project Name]. You have the following up-to-date context:

## Project Overview
[Key facts from PROJECT_BRIEF: purpose, environment, architecture, scope, major constraints, stakeholders]

## Current Status
- In Progress: [active items]
- Recent completions: [most important recent work]
- Blockers: [active blockers]
- First Move: [one concrete action for next session]. Why: [one short reason]

## Key Decisions
[Active decisions with brief rationale]

## Instructions for This Session
- You have full context from the summary above. Do not ask basic orientation questions about the project.
- [Session-specific guidance]
- When making suggestions, take into account the current environment and constraints listed above.
```

## Rules

1. Base the primer on the **final on-disk** PROJECT_BRIEF.md, STATUS.md, and DECISIONS.md. Do not rely on conversation memory alone.
2. Prioritize ruthlessly. Include only what would change behavior in the next session.
3. Write **one** file: `context/prompts/next-session/latest.md`. Do not write a dated twin. Restore path is git history and the private GitHub backup.
4. Do not paste the full primer into chat unless the user asks. The summary card carries its First Move line verbatim and a `Primer refreshed` footer chip.
9. Always write exactly one `First Move:` line. It is the single next action, not a list. Pick from STATUS Next Steps / In Progress, blockers first if one is actionable.
5. If the `context/prompts/next-session/` folder does not exist, skip with a short note. Never block the wrap-up.
6. Do not load resume references to generate this file.
7. Skip generation for Entry Point D (digest) and E (quick capture) unless the user asked for a primer.
8. Do not include "refresh CLAUDE.md", "audit instructions", or a hand-edit of Role/Tone unless the user asked for that this session. Instruction drift is not a next-session First Move.

## When wrap-up regenerates

Regenerate after Entry Points A/B/C if this run wrote any content change to BRIEF, STATUS, or DECISIONS (or equivalents by role). Skip if none of those files changed.

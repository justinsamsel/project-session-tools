# Session Context Updater — Maintainer Notes

Load **only** when designing changes to this skill (ceremony, tiers, new mandatory steps). Do **not** load on runtime Entry Points A–H.

## Philosophy Application

This skill is a **Core Continuity Skill** within the `project-session-tools` hybrid model. It is intentionally more rigorous and structured than Supporting Utilities.

When designing features, adding requirements, or making recommendations:

- Explicitly evaluate whether the change is appropriate for a Core Continuity Skill. Do not increase ceremony by default.
- Prioritize intentionality over process for its own sake. Only make steps, sub-steps, or reference requirements mandatory when they deliver clear, sustained value.
- If a proposed change would meaningfully increase complexity or long-term maintenance burden, flag it and discuss the trade-off.
- When uncertain whether something should be mandatory, default to making it conditional or recommended rather than required.

Reference files are tiered so that only the most commonly needed ones load by default for normal updates. Entity Cross-Reference Sweep (Step 2.5) is conditional; see SKILL.md Step 2.5 Triggers.

## Decision Framework (design sessions)

- **Default to Advisor mode** on decisions involving new features, significant process changes, added ceremony, tier placement, or maintainability tradeoffs.
- **Switch to Executor mode** once the user has explicitly confirmed direction (e.g., "just do it", "implement this", "proceed with option B").
- Standard structured updates on well-understood tasks with no new design decisions: operate in Executor mode by default.

## Parity

When changing resume, portfolio/Bases, core-contract, anti-bloat, or primer regen: run the collection parity checklist (`docs/skill-parity-checklist.md`).

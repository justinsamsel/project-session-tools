# Shared Conventions

Cross-skill conventions shared by all Core Continuity skills in the loop. Keep this file **byte-identical** across `project-builder`, `session-context-updater`, and `project-status-checker`. See `docs/skill-parity-checklist.md` when changing it.

---

## Workflow Context

This skill is part of the skill loop: **ticket-triage** scaffolds project folders from Freshservice tickets → **project-builder** creates project instructions → **session-context-updater** maintains continuity files (PROJECT_BRIEF.md, STATUS.md, DECISIONS.md) → **project-status-checker** audits health and opens each session (Start); **session-context-updater** closes it (End). Each skill works independently; they are designed to flow together.

## Stay on the asked task

Do the job the user named. Do not start a second job.

- Do not scan extra trees (`notes/`, `work/` except `CURRENT.md` when a pin is in play, `archive/`, `skills/`, other projects) unless this entry point requires it.
- Do not offer upgrades, audits, insights files, reorganizing, renaming, or "while we are here" slices.
- Do not write extra primers or registry files as a side effect of an unrelated run.
- If you notice extra work: one line at most, then stop. Never open a new work item, entry point, or skill unless the user asked.

Primer regen after wrap-up, starter context on builder delivery, and checker analysis for the requested entry point are the job, not a side quest.

## File Naming Convention

| File type | Convention | Examples |
|---|---|---|
| Context files (skill-managed) | SCREAMING_SNAKE_CASE | `PROJECT_BRIEF.md`, `STATUS.md`, `DECISIONS.md`, `PROJECT_INSTRUCTIONS.md` |
| Reference files (domain knowledge) | lowercase-kebab-case | `examples.md`, `platform-constraints.md`, `naming-conventions.md` |
| Deliverables/artifacts | lowercase-kebab-case with date | `session-deliverables-20260331.md` |
| Next Session Primer Prompts | `context/prompts/next-session/` with dated files + `latest.md` | `context/prompts/next-session/2026-07-11-1427.md`, `latest.md` |

When creating new files, always use the convention above. When detecting existing files, match by content role first. If a file exists under a non-canonical name (e.g., `project-status.md` instead of `STATUS.md`), work with it as-is. Do not suggest renaming unless the user asked.

## Project Structure

Projects may use either a subfolder structure (preferred for new projects) or a flat structure (legacy):

**Subfolder (preferred):**
```
context/
├── PROJECT_BRIEF.md
├── STATUS.md
├── DECISIONS.md
├── PROJECT_INSTRUCTIONS.md (optional)
└── prompts/next-session/          ← Next Session Primer Prompts + latest.md
references/examples.md, references/platform-constraints.md, ...
```

Do **not** create a `context/backups/` tree for skill-managed copies. Restore path is git history and the private GitHub backup.

**Flat (legacy):**
```
PROJECT_BRIEF.md, STATUS.md, DECISIONS.md, PROJECT_INSTRUCTIONS.md, examples.md, ...
```

When detecting files, check both structures (subfolder first, then flat):
1. `context/STATUS.md` → fall back to `STATUS.md` in project root
2. `context/PROJECT_BRIEF.md` → fall back to `PROJECT_BRIEF.md` in project root
3. `references/examples.md` → fall back to `examples.md` in project root

Use whichever structure exists. If both exist, prefer the subfolder version. Never auto-migrate existing projects from flat to subfolder structure. Do not suggest reorganizing unless the user asked.

## Portfolio Views

Portfolio visibility is provided by **Obsidian Bases**: the live view is `projects/Projects.base`, driven by frontmatter on the context files (fields per `vault-context.md`). Skills may still scan project folders for multi-project work.

`PROJECT_REGISTRY.md` and `SKILL_INSIGHTS.md` are retired. Never create, update, offer, or read them. If a legacy copy is found, ignore it.

## Writing Style

- **No em dashes or double hyphens as interrupters.** Never use em dashes or double hyphens (--) to interrupt or parenthetically insert into a sentence. Do not substitute -- where an em dash would go. Restructure the sentence using commas, periods, semicolons, parentheses, or separate sentences. Applies to all text: status entries, decisions, summaries, bullet points, recommendations, email drafts, Teams messages, and chat replies.

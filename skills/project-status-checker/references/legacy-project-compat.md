# Legacy Project Compatibility

Use when a project was scaffolded with older versions of these skills (or none) while the agent is running **current** skills. Goal: useful work immediately; upgrade only when asked. Never punish age.

**Load:** On first detect of context files when shape looks incomplete/old; for SCU Entry Point H (Upgrade); for infra Entry Point C when user asks to modernize; anytime a path would fail without a modern layout.

## Detection signals (agent-internal)

| Signal | Likely era / gap |
|--------|------------------|
| No `context/` trio (BRIEF / STATUS / DECISIONS by content role) | Pre-continuity or partial setup |
| Context files plain markdown, no YAML frontmatter, path is vault | Pre-Bases / pre-frontmatter |
| No `<!-- session-context-config` | Pre-config / pre-`write_mode` |
| No `context/prompts/next-session/` | Pre-primer / Resume Experience |
| `PROJECT_REGISTRY.md` referenced or present as portfolio source | Pre-Projects.base |
| Instructions only as Claude Project paste; no `CLAUDE.md` on disk | Claude Projects-only or old Code layout |
| STATUS is freeform without dated session blocks | Pre-changelog STATUS |
| DECISIONS missing or ad-hoc bullets only | Pre-decision format |
| Skill paths or docs mention a retired installer or a separate live install folder | Pre-single-home package model |

Record internally as `compat_lag: none | light | material`. Do **not** lecture the user with a long era report unless they asked for an upgrade.

## Graceful defaults (always)

| Area | Behavior |
|------|----------|
| Missing config | Use defaults: `write_mode: auto`, resume offer allowed, staleness 14 days |
| Missing primer | Skip resume offer silently; or generate on accept if infra/SCU handoff requires it |
| Missing frontmatter | Still read/write prose; add frontmatter only when upgrading or when already in-vault and writing |
| Missing STATUS dates | Content-first extract; do not refuse capture |
| Registry absent | Skip registry side-effects; use Bases/frontmatter when present |
| Partial trio | Update what exists; bootstrap only missing roles if user wants continuity |
| Old section names | Map by content role, not filename |
| Coworker on older **skills** | This ref does not fix their install; HOW-TO-INSTALL covers re-copy. Still degrade gracefully on old **projects** |

## Quiet upgrade path

Use graceful defaults and continue the asked job. Do **not** offer Entry Point H during wrap-up, audit, Start, or builder delivery.

Offer upgrade **only** when the user asked to upgrade (or this run **is** Entry Point H): "upgrade this project", "modernize context", "bring project up to current skills", "fix legacy layout".

When they asked, one AskUserQuestion:
1. **Upgrade now** — run SCU Entry Point H (or infra C + light context hygiene)
2. **Not now** — continue with graceful defaults only

Never block core work on decline. Never make upgrade the Recommended First Move of a different job.

## Entry Point H checklist (Upgrade for current skills)

Run only when user accepts upgrade or says: "upgrade this project", "modernize context", "bring project up to current skills", "fix legacy layout".

1. **Inventory** by content role (BRIEF / STATUS / DECISIONS / instructions).
2. **Create missing** continuity files from templates only if absent (do not overwrite history).
3. **In-vault:** add/refresh YAML frontmatter on trio (type, project, status, last-updated) without destroying body content.
4. **Config:** if no `session-context-config`, offer or insert minimal block with `write_mode: auto` (and comment that resume keys are optional).
5. **Primer dir:** ensure `context/prompts/next-session/` exists only if generating a starter; otherwise leave absent (valid).
6. **Registry:** do not create `PROJECT_REGISTRY.md`. Note Projects.base if in vault portfolio.
7. **Instructions:** if `CLAUDE.md` missing but instructions exist elsewhere, note path; recommend infra Entry Point C for standards refresh (do not rewrite domain rules here unless asked).
8. **Post-write summary:** short list of what changed + "You can keep working as usual."

## Compat matrix (old shape → current skill)

| Old shape | Current skill behavior | Optional fix |
|-----------|------------------------|--------------|
| No config block | Defaults apply (`write_mode: auto`) | Add minimal config on upgrade |
| No primer | No resume offer (silent) | Generate after next capture/delivery if wanted |
| No frontmatter | Prose still works | Add frontmatter on upgrade (vault) |
| Registry-only portfolio | Skills skip mandatory registry updates | Use Projects.base + BRIEF frontmatter |
| No STATUS dates | Capture still appends modern dated entry | Leave history; new entries modern |
| Thin / missing DECISIONS | Capture still works | First real decision creates format |
| Old CLAUDE.md sections | Infra C refreshes structure, keeps project-specific rules | Run audit/refresh |
| Skills copied long ago | Behavior may lag package | Re-copy `skills/` per HOW-TO-INSTALL |

## Output cleanliness

- No upgrade pitch unless the user asked to upgrade. Then one question, not a multi-page audit of "what's wrong with your project."
- Never imply the user or coworker did something wrong.
- Never require upgrade before SCU auto-write or checker dashboard.

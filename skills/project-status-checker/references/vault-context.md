# Vault-Aware Context Behavior

Keep this file **byte-identical** across `project-builder`, `session-context-updater`, and `project-status-checker`. See `docs/skill-parity-checklist.md` when changing it.

After the vault cutover, project work lives under `{vault-root}/projects/{project-name}/` (or equivalent projects root). Context files sit in `context/` inside each project. Skills operate CWD-relative; YAML frontmatter on context files powers Obsidian Bases portfolio views.

## When to Load This File

| Skill | When |
|-------|------|
| **SCU** | Entry Points A, B, C (frontmatter on writes). Skip for D, E, F, G. Load for H when creating/updating vault frontmatter. |
| **PSC** | All entry points (parse frontmatter; optional health write after score). |
| **Builders** | Step 0 / Deliver (frontmatter on new or refreshed starter context). |

## Vault Detection

Check whether CWD is inside the designated Obsidian vault. Windows registry file: `%APPDATA%\obsidian\obsidian.json`:

```json
{"vaults":{"<id>":{"path":"C:\\Users\\...\\Vault","ts":...,"open":true}}}
```

**Filter:** keep vault entries whose `path` basename equals `Vault` (case-sensitive). Legacy registered folders that are not the canonical Vault are ignored.

**Match:** if any kept vault `path` is a prefix of the resolved absolute CWD, **in-vault mode is on**. Obsidian does not need to be running.

If `obsidian.json` is missing, no vault named `Vault` exists, or CWD is not under one: in-vault mode is **off** (plain markdown, no frontmatter).

## Frontmatter Schema

When in-vault mode is on, context files carry YAML frontmatter at the top:

```yaml
---
type: brief | status | decisions | instructions
project: {project-name}
status: {current phase from STATUS, lowercase word or short phrase}
last-updated: YYYY-MM-DD
health: 91              # optional; plain number, portfolio score (see ownership below)
last-check: YYYY-MM-DD   # optional; date of last project-status-checker score
version: {optional}
owner: {optional; from BRIEF stakeholders}
related-systems:
  - {optional; from BRIEF environment}
---
```

### Field ownership (who writes what)

| Field | Written by | Notes |
|-------|------------|--------|
| `type`, `project`, `status`, `last-updated`, `owner`, `related-systems` | **session-context-updater** (and builders on bootstrap) | SCU is the continuity write engine |
| `health`, `last-check` | **project-status-checker** after a scored single-project run (A, B, or C when a composite score was computed) | **Narrow exception** to checker read-only: frontmatter keys only, never body prose of BRIEF/STATUS/DECISIONS |
| All fields | **Builders** when creating starter context | Omit `health`/`last-check` until a checker run exists |

**Rules:**
- **Preserve user-added fields** the skill does not recognize.
- **SCU:** update `last-updated` on every context write; update `status` from Overall phase when known; **preserve** existing `health`/`last-check`; only the checker writes them.
- **Checker:** after computing a composite health score for **one** project, if in-vault mode: set `health` and `last-check` on `context/PROJECT_BRIEF.md` (and STATUS if it already has frontmatter). Do **not** rewrite STATUS/BRIEF/DECISIONS body content. Multi-project Entry Points E/F: update frontmatter only for projects that received a full composite score (E optional per project; F light rank does **not** require writing health).
- **Never write frontmatter when in-vault mode is off.**
- **Never create or update `PROJECT_REGISTRY.md`.** Portfolio is `projects/Projects.base` + frontmatter.

## Write Rules (SCU and builders)

Targets are always CWD-relative: `{cwd}/context/{FILE}.md`. No multi-tier resolution. No dual-write.

- Write in place; do **not** create `context/backups/*.bak-*`. Restore path is git history and the private GitHub backup.
- Prepend or update frontmatter if in-vault mode is on; omit frontmatter if off.

## Read Rules (all skills)

Read CWD-relative context paths. If in-vault and frontmatter is present, treat frontmatter as authoritative for `status`, `last-updated`, `health`, `last-check`, `owner`, etc. Fall back to prose scraping only when frontmatter is absent.

## Bootstrap (builders)

- **In-vault:** write starter context with frontmatter (`type`, `project`, `status`, `last-updated`; optional owner/related-systems from elicitation). No health until checker runs.
- **Off-vault:** plain markdown.

## Archive / un-archive (SCU Entry Points F/G)

- Archive: set `status: archived` on context frontmatter; refresh `last-updated`. Folder stays put.
- Un-archive: set `status` back to an active phase (from BRIEF/STATUS or `active`). No registry file.

## Name Override

If the folder basename should not be the `project` frontmatter value, place `.vault-config.json` at the project root:

```json
{ "project": "Custom Display Name" }
```

All core skills honor this override when setting or reading `project`.

## Legacy Archive Note

Older `Documents/Claude Projects/` (or similar) trees may be read-only archives. If CWD is clearly an archive path outside the live vault projects root, warn once and do not treat as the live project home.

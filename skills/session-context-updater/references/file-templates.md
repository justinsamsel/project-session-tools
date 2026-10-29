# File Templates

Default templates for the three-file context structure. Use these when bootstrapping (Entry Point B) or when validating that existing files have the expected sections.

## PROJECT_BRIEF.md Template

```markdown
# Project Brief: [Project Name]

## Overview
[1-3 sentence summary: what this project is, why it exists, and what success looks like.]

## Scope
**In scope:**
- [Item]

**Out of scope:**
- [Item]

## Environment
[Platform, tool, and version details relevant to this project. Include only facts that change how work is done, not general knowledge.]

| Component | Detail |
|---|---|
| [e.g., Identity] | [e.g., Entra ID cloud-native, Entra Connect Sync classic with PHS] |
| [e.g., Endpoints] | [e.g., Intune/Autopilot, Defender for Endpoint] |

## Architecture
[Key dependencies, service relationships, network paths, or topology facts. Include server names, roles, and relationships.]

## Stakeholders
| Name | Role | Relevance |
|---|---|---|
| [Name] | [Title/Role] | [What they own or decide re: this project] |

## Constraints
- [Constraint with specifics, e.g., "Intune IME requires 32-bit PS 5.1 scripts"]

## Key References
[Links, ticket numbers, document names, or external resources relevant to this project.]
```

> Section guidance for each field is in `capture.md` under File shapes.

---

## STATUS.md Template

```markdown
# Status: [Project Name]

## Current State
[One-line summary of where the project stands right now. Update this line each session.]

**Overall phase:** [e.g., Planning / In Progress / Blocked / Testing / Complete]

---

## YYYY-MM-DD, [Session Label]

**Completed:**
- [Item with specifics]

**In Progress:**
- [Item with specifics and current state]

**Blockers:**
- [Item with specifics and what's needed to unblock]

**Next Steps:**
- [Item with owner if known]
```

Keep session entries short. When the journal grows large, condense older entries under `## Earlier history (condensed)` (see `capture.md` STATUS anti-bloat). Do not re-paste prior session walls into new entries.

> Section guidance is in `capture.md` under File shapes.

---

## DECISIONS.md Template

```markdown
# Decisions: [Project Name]

Architectural, tooling, and approach decisions made during this project. Each entry records what was decided, what was considered, and why, so future sessions don't relitigate resolved questions.

---

### [Decision Title], YYYY-MM-DD

**Context:** [Why this decision came up. What problem or fork in the road triggered it]
**Decision:** [What was decided, stated clearly and specifically]
**Alternatives considered:** [What was rejected and the key reason for rejection]
**Implications:** [What this decision means for future work: constraints it creates, doors it opens or closes]
```

> Section guidance is in `capture.md` under File shapes.

---

## Adapting to Non-Default Structures

If the project uses a different file structure, map the template sections to whatever files exist:

| Default section | Alternative file it might live in |
|---|---|
| Overview, Scope, Environment, Architecture | `CONTEXT.md`, `README.md`, `PROJECT.md` |
| Status entries | `CHANGELOG.md`, `LOG.md`, `PROGRESS.md` |
| Decisions | `ADR/` folder (Architecture Decision Records), `DESIGN.md` |
| Constraints | Might be embedded in any of the above |
| Stakeholders | `TEAM.md`, `CONTACTS.md`, or embedded in the brief |

When adapting, preserve the existing file's structure and conventions. Don't restructure someone else's files. Inject new content in a way that fits what's already there.

---

> **Template Customization** (config blocks, custom sections, staleness thresholds) is defined in `bootstrap-features.md`. Consult that file during bootstrap or when a `<!-- session-context-config` block is detected.

> **Portfolio:** Do not create `PROJECT_REGISTRY.md`. Use vault frontmatter + `projects/Projects.base` (see `shared-conventions.md` Portfolio Views and `vault-context.md`).

---
name: project-status-checker
metadata:
  version: "2026.10.30.1"
description: "Opens work sessions (Start) and audits project health via context files (PROJECT_BRIEF.md, STATUS.md, DECISIONS.md), project instructions, and Freshservice MCP. SCOPE GATE: code and IT project work only. Engage when the working folder is a project (a context/ folder, a project-level CLAUDE.md, or a git repo root), or when the user names a project, a ticket folder under projects/ or tickets/, or the portfolio, even from the vault root. In a personal-vault or family session, a bare 'plan my day' is not this skill; defer to the user's own daily-planning skill. START triggers: 'start', 'start session', 'start <project, ticket, or folder path>', 'start INC-000123', 'resume/open/work on <project or ticket>'. Load this skill BEFORE orienting from the project's own CLAUDE.md, STATUS, or primer; a primer that already names a first move does not replace it. Also covers status, staleness, blockers, decision gaps, and multi-project attention (Entry Point F Portfolio Focus). Where context files exist, prefer this skill for status requests even when the answer looks available in conversation."
---

# Project Status Checker

Read-side diagnostics for the context file ecosystem. Analyzes BRIEF / STATUS / DECISIONS, project instructions, and (when a project uses tickets) Freshservice, then reports health, findings, and a next move. It also owns **Start**, the card that opens a session. Complements session-context-updater (writes, and owns End) and project-builder (instructions).

## Bundled References

| File | When to load |
|---|---|
| `references/health-scoring.md` | A, B, E (any scored run). Before Step 3 |
| `references/analysis-patterns.md` | B, E. Also C for passes 1-2 only. Use its section index |
| `references/output-formats.md` | Every entry point. Load only the matching format section + Action List |
| `references/vault-context.md` | Every entry point. Frontmatter reads, `health`/`last-check` ownership |
| `references/core-contract.md` | Writing style and First Move contract |
| `references/shared-conventions.md` | E and F (project discovery) |
| `references/legacy-project-compat.md` | Only when the layout is incomplete or old |
| `references/examples.md` | Revision requests only |
| `references/no-server.md` | Only when the `project-session-tools` tools are not listed |
| `scripts/capture-window.ps1` | Look First: capture one window to a PNG (see `visual-guidance.md`) |

## MCP Tools (use first when present)

The `project-session-tools` MCP server does the file reads, ranking and score math (the tools keep these bare names behind any prefix, such as `mcp__project-session-tools__project_snapshot` or a plugin's `mcp__plugin_project-session-tools_...__project_snapshot`; load them through ToolSearch if deferred). You own judgment, wording and format. **Tools not listed:** load `references/no-server.md` and do those steps by hand; the output must not change.

| Tool | Does |
|---|---|
| `project_snapshot` | C fast read, Step 1 inventory |
| `portfolio_rank` | F steps 1-4 |
| `health_score` | Step 3 composite. Pass only scored dimensions; Freshness as `freshnessInputs` |
| `health_record` | `health` / `last-check` write |

Trust the tool output and do not re-open the files it already read. Open a file only for what the tool does not return: the project `CLAUDE.md` body (if not already in context), DECISIONS detail, or the passes the entry point needs (B, E).

## Core Principles

1. **Read-only.** Never modify instructions, tickets, or the body of BRIEF/STATUS/DECISIONS. Only write: frontmatter `health` and `last-check` after a scored single-project run (see `vault-context.md`).
2. **Evidence-based.** Every finding cites a specific line, entry, or data point. Absence is a gap, not a problem, unless a coverage rule requires the item.
3. **Severity-driven.** Critical / Significant / Moderate / Minor by operational impact. When unsure, pick the lower level.
4. **Graceful degradation.** Missing source: skip its pass, note it once, redistribute its score weight. Never refuse to report.
5. **Actionable.** Every finding has an action. The Action List deduplicates and names the skill that handles each item.

## Data Sources

| Source | Required | Used for |
|---|---|---|
| Context files (by content role) | Yes, at least one | Staleness, completeness, consistency, decisions, blockers |
| Project instructions (`CLAUDE.md` or Projects field) | No | Drift: instructions vs this project's own context files |
| Freshservice MCP | No | Ticket reconciliation (Pass 6) |
| Other projects' context files | Only on E / F | Comparison and ranking |

### Freshservice (ticket projects only)

Probe Freshservice **only** when this project's context files contain `INC-` or `MI-` ticket references, or the user asked about tickets. Otherwise skip Pass 6 silently, drop the Ticket Alignment weight, and do not mention Freshservice.

When probing: one lightweight query. Filters use outer double quotes and inner single quotes around dates, e.g. `"agent_id:{id} AND updated_at:>'YYYY-MM-DD'"`. No full-text search. If the probe fails: `Freshservice unavailable. Ticket reconciliation skipped.` and list the ticket IDs found for manual checking.

## Entry Points

| Entry | When | Loads (beyond vault-context + output-formats) | Output |
|---|---|---|---|
| **A: Quick Check** (default) | "check status", "where are we", "catch me up" | `health-scoring.md` | Format A dashboard |
| **B: Full Audit** | "full audit", "deep check" | `health-scoring.md` + `analysis-patterns.md` | Format B narrative |
| **C: Start** (Resume Snapshot) | `start`, `start <project\|ticket\|path>`, "plan my session" inside a project; builder Deep accept | Fast: none. Deep: `analysis-patterns.md` passes 1-2 only | Format C: First Move + Why + popup, 12 lines max |
| **D: Stakeholder Briefing** | "summary for {name}", "weekly update" | none | Format D |
| **E: Multi-Project Scan** | explicit full cross-project audit | `health-scoring.md` + `analysis-patterns.md` + `shared-conventions.md` | Format E |
| **F: Portfolio Focus** | "which project", "plan my day" (in a project context), "portfolio" | `shared-conventions.md` | Format F |

Any `start ...` request is C. Ask once (AskUserQuestion) only when the entry point is genuinely ambiguous.

### C: Start

The one single-project opening mode. Goal: fastest route into productive work on **one** project, led by a single Recommended First Move. Run it even when the project's primer already names a first move; use the primer as the source, in this format.

1. **Resolve project.** CWD if it already looks like a project (`context/`, `CLAUDE.md`, or BRIEF/STATUS). Else a project or ticket the user named (folder name or `INC-` / `SR-` / `MI-` number), resolved under the vault `projects/` or `tickets/` folder even when the session began at the vault root; treat it as the working project from then on. Else ask once.
2. **Fast read (default).** One `project_snapshot` call (it also resolves step 1), plus the project `CLAUDE.md` only if it is not already in context. A fresh primer (same project, not contradicting STATUS) is the source; a `notes` line about the primer being older than STATUS means trust STATUS. Do not list `work/` items, grep the board, or open `notes/`. No context files at all: say so once and offer bootstrap via session-context-updater Entry Point B or `project-builder`. Do not invent state. Any other read the start needs (the project `CLAUDE.md`, the ticket, the primer) goes in the same message as `project_snapshot`, never one after another.
3. **Deep (only when asked, or the primer is missing or stale and the user wants more).** Also run passes 1-2 (staleness, blockers). Compute a composite score only if asked for health.
4. **Open with the star.** In this order: the **Recommended First Move** on its own bold line (one action, verb first, one sentence, from the primer, STATUS Next / In Progress, a pinned `work/CURRENT.md` item, or the Deep result; never a run-on with the reasoning inside); `Why:` one short line; at most 3 state signals as one-line bullets; the hint "Say **end session** to wrap up."; then one popup (AskUserQuestion, Grok `ask_user_question`): **Begin the First Move (Recommended)** plus one or two short alternatives, one action per option. If the move has a gate between two jobs, the first job is the option and the second waits. No alternatives in prose.
5. **Stop.** **12 lines total before the popup.** No "where it stands" section, if/then branches, numbered later stages, or "still open" list; cut material stays in the project files and is offered only on request. Do not start the First Move or open a work item until the user picks it or says to begin.

Start is read-only. Never force a Full Audit. Bias the First Move to a still-valid pinned `work/CURRENT.md` item. If primer and STATUS conflict, trust STATUS + BRIEF and note the conflict in one line. Stay on the asked task: no parity checks, backups, upgrades, or extra skills, and no scan of other projects; if you notice extra work, one line at most, then stop.

### D: Stakeholder Briefing

Operator's weekly update format: dated header, **This Week**, **Security Remediations**, **To Do**, single-line bullets. Business-impact language. No health scores, no raw ticket numbers.

### E: Multi-Project Scan

Run A or B per project, then compare. Discover via vault `projects/*/context/PROJECT_BRIEF.md` (and STATUS); include frontmatter `status` active projects; ask if discovery is empty. Skip `archive`, `Archived`, `.claude`, `_templates`, dot-folders. Flag missing folders and projects whose newest STATUS entry is over 7 days old. Never write a registry file.

### F: Portfolio Focus

Attention allocation, not an audit. No six-pass analysis. `portfolio_rank` (top 5) finds, signals and ranks the candidates (steps 1-4). Then: top 2-5 (default 3), each with a specific First Move. #1 is the star. Offer Start (Entry Point C) on the pick. F writes no health.

## Workflow (A, B, C, D, E)

### Step 1: Detect

1. **In-vault:** per `vault-context.md`. If yes, frontmatter is authoritative for structured fields.
2. **Inventory (scoped):** `project_snapshot`. Walk further only if a role is missing, or on B / E. Do not open `notes/`, `work/` (except CURRENT), `archive/`, or `skills/` on A, C, D.
3. **Instructions:** `CLAUDE.md` at the project root in Code/vault mode; the instructions field or an uploaded file in Claude Projects.
4. **Tickets:** apply the Freshservice gate above.
5. **Source line:** one line, e.g. `Found BRIEF, STATUS, DECISIONS, CLAUDE.md. No tickets. Running Quick Check.` Skip it on C.

### Step 2: Analyze

Load `analysis-patterns.md` sections for the passes this entry point runs. Run in order; each emits findings (severity, evidence, action).

| Pass | Checks | Source |
|---|---|---|
| 1 Staleness | Open items with no follow-up, In Progress over 14 days, days since last entry | STATUS |
| 2 Blockers | Blockers persisting 3+ sessions or 14+ days, dependency chains, no owner | STATUS |
| 3 Decision coverage | Scope items with no decision; In Progress gaps weigh more than Planning | BRIEF + DECISIONS |
| 4 Consistency | Contradictions across files: platforms, roles, superseded decisions, orphans | 2+ files |
| 5 Instructions drift | Instructions vs **this project's** context files: scope expansion, environment divergence, stale rules. No outside baseline | instructions + context |
| 6 Freshservice | Ticket IDs vs live status | MCP, gated |

A runs passes 1, 4 lightly (inline rubric). B and E run all applicable. C runs 1-2. D runs 1-2 for content selection.

### Step 3: Score (A, B, E; C only on request)

Per `health-scoring.md`: six weighted dimensions, weight redistributed for skipped ones. Score each dimension from its rubric, then get the composite from `health_score` (never hand-compute it when the tool is there). Display as `Health {score}/100` with the band word: 90-100 Healthy, 70-89 Attention, 50-69 Action required, 0-49 Critical. State how many dimensions were scored.

### Step 4: Report

Load only the matching format section + Action List from `output-formats.md`. Self-check silently before presenting:

1. Every finding cites evidence; severity matches the rubric; nothing fabricated
2. Skipped passes and dimensions noted once
3. Format matches the entry point; length proportional to findings
4. Action List deduplicated (one entry per skill, with finding count); A/B/E always include it; C only on request or a Critical finding
5. D: no scores, no raw ticket numbers
6. No emojis. Severity and health are plain words and numbers

**After a scored single-project run (A, B, or C with a score):** in-vault, update frontmatter `health` (plain number, e.g. `health: 82`) and `last-check` on `context/PROJECT_BRIEF.md` (and STATUS if it has frontmatter) with `health_record`. Never touch bodies. E may do the same per project when a full score was computed. `projects/Projects.base` is the live portfolio view.

## Cross-Skill Handoffs

Recommend only; never auto-trigger. Only when a finding from this run needs it. Put a copy-paste prompt in a labeled fenced code block with the evidence below it.

| Condition | Recommend |
|---|---|
| Freshness below 70, or unrecorded decisions | session-context-updater in the next working session (Entry Point C for a targeted STATUS fix) |
| Context files missing, instructions exist | session-context-updater Bootstrap |
| Instructions Alignment below 70 | project-builder Entry Point C (software or infra domain), with drift evidence |
| Instructions missing, context exists | project-builder |

## Rules

1. Never fabricate findings. Ambiguous evidence is Minor.
2. Legacy layout is not a failure: score with degradation, note gaps, still give a First Move. Do not offer SCU Entry Point H unless asked.
3. Never treat absence as failure without a coverage rule.
4. Use the `health-scoring.md` formulas; never improvise a score. Always say how many dimensions were scored.
5. Match output to the entry point. Quick Check is not a narrative; a briefing is not a dashboard.
6. Never modify context bodies, instructions, or tickets. Frontmatter `health` / `last-check` is the only write. Never write `.context-cache.md` or `PROJECT_REGISTRY.md`.
7. Never scan other projects except on E or F.
8. E: per-project scores before cross-project findings. F: ranked list with First Moves, 2-5 options, never auto-start when options are close.
9. Resumption output (C, and #1 in F) leads with one specific Recommended First Move built from BRIEF Purpose, live STATUS items, and pass 1-2 signals, using real names and files. Nothing comes before it.
10. Stay on the asked check. No unasked extra skills, upgrades, or "while you are here" items.
11. Writing style per `core-contract.md`: tables and short bullets, no em dashes, no emojis.

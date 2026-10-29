# Output Formats

Load only the section for the active entry point, plus the Action List (A, B, E; C only on request or a Critical finding; F uses its own short list).

| Section | Entry Point |
|---|---|
| Format A: Dashboard | Quick Check (default) |
| Format B: Full Narrative | Full Audit |
| Format C: Start | Start |
| Format D: Stakeholder Briefing | Stakeholder Briefing |
| Format E: Multi-Project Dashboard | Multi-Project Scan |
| Format F: Portfolio Focus | Portfolio Focus |
| Action List | A, B, E |

---

## Format A: Dashboard (Entry Point A)

Compact, one screen.

```
## Project Health: [score]/100

| Dimension | Score | Key Finding |
|-----------|-------|-------------|
| [Name] | [score] | [one-line top finding] |

Scored: [N]/6 dimensions [; skipped dimensions and why]

---

### Findings

**Critical** / **Significant** / **Moderate** / **Minor**
- [Finding], [evidence] → [action]

---

### Action List
```

- Max 2 lines per finding; more detail is Entry Point B.
- Omit empty severity sections. Never write "Critical: None."
- Abbreviate evidence: "STATUS.md → 2025-03-15 entry", not full quotes.
- Score 90+: collapse findings into one "All clear" line plus any minor items.

---

## Format B: Full Narrative (Entry Point B)

```
## Project Status Audit: [Project Name], [Date]

### Health Summary
[Format A table]

### Detailed Findings
#### Freshness & Staleness
#### Blocker Analysis
#### Decision Coverage
#### Consistency
#### Ticket Alignment      [omit when not probed]
#### Instructions Drift    [omit when no instructions]

---

### Action List
```

- Each section: a 2-4 sentence summary (dates, counts, coverage ratio, drift type: scope, environment, or rule), then its findings with evidence and actions.
- Quotes under 15 words; paraphrase longer content.
- Cross-reference related findings ("C3 and S2 both resolve with one STATUS update").
- Length tracks finding count. A healthy project gets a short narrative.

---

## Format C: Start (Entry Point C)

The spec is SKILL.md C step 4. Template:

```
**{project}** · Health {score}/100 · {one-line state}     <- only when a score was computed

**Recommended First Move: {one action, verb first, real names and files}**

Why: {one short line}

- {state signal}                                         <- at most 3

Say **end session** to wrap up.
```

Then the popup. A Critical finding adds one line under the signals; otherwise no findings or Action List unless asked.

---

## Format D: Stakeholder Briefing (Entry Point D)

```
## [Date]

**This Week**
- [Accomplishment, business-impact framing]

**Security Remediations**   [omit when none]
- [Remediation in plain language]

**To Do**
- [Leadership asks first, then next deliverables]
```

- No health scores (the score only picks content). No ticket numbers unless the stakeholder tracks them.
- Translate jargon: "stale context files" → "project documentation needs updating"; "decision coverage gap" → "the approach for [area] isn't formally documented yet."
- Escalations go in To Do as a clear ask: "Need decision from Avery on database server approach", not "Blocker: awaiting leadership."
- Single-line bullets, max 5 per section, direct tone, no hedging.

| Technical finding | Stakeholder line |
|---|---|
| STATUS.md stale 16 days on BitLocker rollout | BitLocker documentation needs catch-up, 18 of 60 workstations enrolled |
| Freshservice ticket resolved but STATUS shows In Progress | Branch office printing issue resolved; documentation being updated |

---

## Format E: Multi-Project Dashboard (Entry Point E)

```
## Multi-Project Status, [Date]

### Project Scores
| Project | Health | Top Issue | Last Updated |
|---------|--------|-----------|--------------|

### Cross-Project Findings
- [Finding], affects [Project A] and [Project B]

### Per-Project Details
#### [Project]
[Format A findings list only]

---

### Combined Action List
```

- Sort scores ascending (worst first).
- Cross-project findings only for shared blockers, dependency chains, or conflicting decisions.
- Per-project details: findings and actions, no prose, no dimension table.
- Combined list deduplicates: one entry per skill with "Affects: [A], [B], [C]."

---

## Format F: Portfolio Focus (Entry Point F)

```
## Portfolio Focus, [Date]

**Recommended pick:** **[Project]**: [one-line First Move]

Why this session: [1-2 sentences from the portfolio_rank signal]

| # | Project | Why now | Recommended First Move |
|---|---------|---------|------------------------|
| 1 | [Name] | [signal] | [concrete move] |

### Skipped / low priority   [omit when nothing useful]
- [Project]: [one line]
```

Then one popup: the top two or three projects, the pick first, plus **Cross-project audit** when a comparison may be wanted. A pick runs Start (C) on it.

- 2-5 rows (default 3). The pick meets the same bar as a single-project First Move.
- No dimension tables. Action list at most 3 lines (start top pick; optional capture on a stale project; optional full audit).

---

## Action List (A, B, E)

```
### Prioritized Actions

**Critical** / **Significant**
1. [Action], [reason, finding IDs]
   Skill: [session-context-updater / project-builder / manual]
   Scope: [what changes]

**Moderate**
1. [Action], [reason]. Skill: [skill or manual]

**Minor**
- [Action], [reason]
```

- One entry per skill: "Run session-context-updater, resolves S2, S3, C3 (2 stale items, 1 stale Brief fact)."
- Mark each action "Can act now" or "Requires: [input from whom]".
- Dashboard: max 3 per severity. Full Audit: all.
- Always at least one action; a 100/100 project still gets a maintenance item.

# Without the MCP server

Load this only when the `project-session-tools` tools are not listed. Each section is the by-hand version of one tool. The output must match what the tool path produces.

## C fast read (replaces `project_snapshot`)

Read, in order, if present: project `CLAUDE.md`, `context/PROJECT_BRIEF.md`, top of `context/STATUS.md` (Current State + newest 1-2 entries only), newest decision only if clearly relevant, `work/CURRENT.md`. If `context/prompts/next-session/latest.md` exists and is fresh (same project, not contradicting STATUS), treat it as the **primer**.

## Step 1 inventory (replaces `project_snapshot`)

`context/PROJECT_BRIEF.md`, `STATUS.md`, `DECISIONS.md` (or flat-root equivalents) and `CLAUDE.md`, classified by content. `work/CURRENT.md` if present. Walk further only if a role is missing, or on B / E.

## F steps 1-4 (replaces `portfolio_rank`)

1. **Root:** vault `projects/` if in a vault; else parent of CWD if it holds several projects; else ask once.
2. **Candidates:** folders with `context/PROJECT_BRIEF.md` and/or `context/STATUS.md`. Skip archived / completed / cancelled.
3. **Light signals:** BRIEF frontmatter (`status`, `health`, `last-updated`), STATUS Current State + newest entry date (first ~80 lines), `work/CURRENT.md`, optional count of `work/*.md` at `ready` / `in-progress`.
4. **Rank:** pinned CURRENT item > open ready/in-progress items > active but stale (7-59 days, most recent first) > actionable blockers > dormant (60+ days, likely parked, most recent first). Healthy + empty board + no pin ranks low.

## Step 3 composite (replaces `health_score`)

Weights are in the `health-scoring.md` Dimensions table. Show the arithmetic only if asked.

- **Composite:** `Σ(score × weight) / Σ(weights of scored dimensions)`, rounded. Skipped dimensions drop out, so the remaining weights scale up proportionally.
- **Freshness** = 0.5 × days score + 0.3 × stale ratio + 0.2 × blocker age:
  - Days since last entry: 100 if ≤3, 80 if ≤7, 60 if ≤14, 40 if ≤30, 20 if ≤60, else 0.
  - Stale ratio: 100 × (1 − stale / open items); 100 when nothing is open.
  - Blocker age: 100, minus 20 per blocker older than 14 days, floor 0.
- **Band:** 90-100 Healthy, 70-89 Attention, 50-69 Action required, 0-49 Critical.

## Health write (replaces `health_record`)

Edit frontmatter `health` (plain number) and `last-check` (today, YYYY-MM-DD) on `context/PROJECT_BRIEF.md`, and on STATUS if it has frontmatter. Never touch bodies.

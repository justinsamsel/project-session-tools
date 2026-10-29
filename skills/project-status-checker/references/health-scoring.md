# Health Scoring

Per-dimension rubrics and severity. You score dimensions 2-6 from the rubrics; `health_score` returns the composite, redistributed weights, band word and display line. By-hand math (composite, redistribution, Freshness formula, bands) is in `no-server.md`.

## Dimensions

| # | Dimension | Weight | Score only when | Measures |
|---|-----------|--------|-----------------|----------|
| 1 | **Freshness** | 0.25 | Status file exists | Time since last entry, open items without follow-up, blocker age |
| 2 | **Completeness** | 0.15 | Any context file | Expected files and sections present with substance |
| 3 | **Decision Coverage** | 0.15 | Brief + Decisions | Scope items with recorded decisions |
| 4 | **Consistency** | 0.20 | 2+ context files (or files + instructions) | Facts agree across files |
| 5 | **Ticket Alignment** | 0.10 | Freshservice probed (gate in SKILL.md) | Ticket status matches context entries |
| 6 | **Instructions Alignment** | 0.15 | Project instructions present | Instructions reflect current reality |

Pass only the dimensions you scored. Always report how many: "Health 78/100 (5 of 6 dimensions; Ticket Alignment skipped, no tickets)".

## Rubrics

### 1: Freshness

Pass `freshnessInputs` instead of a score: `daysSinceLastEntry`, `staleItems`, `openItems`, `blockersOver14Days`. An item is stale if it appeared as In Progress or Next Steps in an entry 14+ days ago with no follow-up.

### 2: Completeness

| Factor | Share | Calculation |
|--------|-------|-------------|
| File presence | 40% | 100 if all three roles present. −30 per missing role |
| Section substance | 40% | 100 × (sections_with_substance / required_sections). Substance = 2+ non-header lines |
| Current State quality | 20% | 100 if specific (metric, count, or concrete milestone). 50 if generic. 0 if missing |

### 3: Decision Coverage

| Factor | Share | Calculation |
|--------|-------|-------------|
| Coverage ratio | 60% | 100 × (scope_items_with_decisions / total_scope_items). Covered = a DECISIONS entry names it or a clear synonym |
| Phase-weighted gaps | 40% | Start 100. Per uncovered item: −15 if phase is In Progress or later, −5 if Planning |

### 4: Consistency

| Factor | Share | Calculation |
|--------|-------|-------------|
| Contradictions | 60% | Start 100. −20 platform/tool, −15 scope boundary, −10 naming. Floor 0 |
| Temporal coherence | 20% | 100 if STATUS is chronological and no decision is cited before its date. −25 per violation |
| Supersession | 20% | 100 if superseded decisions are marked. −25 per unmarked contradiction with a newer decision |

### 5: Ticket Alignment

| Factor | Share | Calculation |
|--------|-------|-------------|
| Status match | 50% | 100 × (matching / referenced). Match = Freshservice status agrees with the context entry |
| Unlinked | 30% | 100 × (1 − unlinked / assigned). Unlinked = assigned to the operator, updated in 30 days, not in any context file |
| Phantom | 20% | 100 × (1 − phantom / referenced). Phantom = referenced but not found in Freshservice |

### 6: Instructions Alignment

| Factor | Share | Calculation |
|--------|-------|-------------|
| Scope | 40% | Start 100. −15 per context scope item not in instructions scope. −10 per instructions scope item with no context activity |
| Environment | 35% | Start 100. −20 per environment fact that differs without a decision recording the change |
| Rule relevance | 25% | Start 100. −15 per rule tied to a constraint a decision removed. −10 per rule naming a tool or platform absent from context files |

## Severity

| Severity | Meaning | Typical |
|----------|---------|---------|
| **Critical** | Immediate operational risk | Data loss risk, production safety gap, ownerless blocker 30+ days, instructions directly contradict active work |
| **Significant** | Act this session | Active items stale 14+ days, decision gap on In Progress scope, ticket mismatch, escalation-worthy blocker |
| **Moderate** | Act soon | Stale 7-14 days, decision gap on Planning scope, minor inconsistency, drift in non-critical instructions |
| **Minor** | Informational | Low-priority items under 7 days, gaps in conditional sections, unlinked low-priority tickets |

- Severity follows operational impact, not finding type.
- Unsure between two levels: pick the lower.
- A blocker persisting 3+ sessions, or a contradiction involving production systems, is Significant or higher.

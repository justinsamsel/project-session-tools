# Analysis Patterns

Detection rules, evidence requirements, and false-positive avoidance for each of the six analysis passes. Every finding produced by these passes must include: a severity level, an evidence citation (file + section + specific content), and a recommended action. **Load passes sequentially. Read each pass section before running that pass.**

**Section index (for selective loading):**
| Section | Purpose | Data Source Required | Load when |
|---|---|---|---|
| Pass 1: Staleness Analysis | Temporal drift in open items | Status/Log file | Quick Check, Full Audit, Resume Snapshot |
| Pass 2: Blocker Escalation | Recurring/persistent blockers + chains | Status/Log file | Full Audit, Resume Snapshot |
| Pass 3: Decision Coverage | Scope-to-decision mapping + gaps | Brief + Decisions files | Full Audit |
| Pass 4: Consistency Validation | Cross-file contradictions | 2+ context files | Full Audit |
| Pass 5: Instructions Drift | Scope/environment/rule drift | Project instructions + context files | Full Audit |
| Pass 6: Freshservice Reconciliation | Ticket status vs context files | Freshservice MCP | Full Audit (if MCP available) |

**Load rule:** Read only the sections needed for the current entry point. Use the index to jump.

---

## Pass 1: Staleness Analysis

**Purpose:** Detect temporal drift in Status/Log files: open items aging without follow-up, sessions without updates, and unreferenced Next Steps.

### Custom Threshold Detection

Before applying the default staleness thresholds below, check all context files for a `<!-- session-context-config` block (used by session-context-updater for template customization). If found, parse the `staleness_threshold_days` value and use it as the baseline threshold for S2 and S3 severity calculations instead of the hardcoded defaults. This ensures staleness findings align with the project's configured expectations.

If no config block is found or if `staleness_threshold_days` is absent or malformed, use the default thresholds shown in the Detection Rules table.

### Detection Rules

| ID | Finding | Evidence Required | Severity Logic |
|----|---------|-------------------|---------------|
| S1 | **Last entry age** | Date of most recent STATUS.md session entry vs. today | Minor ≤7d, Moderate 8–14d, Significant 15–30d, Critical >30d |
| S2 | **Stale In Progress item** | Item text + originating session date + no mention in any subsequent session | Moderate if 7–14d since originating session, Significant if 15–30d, Critical if >30d |
| S3 | **Orphaned Next Step** | Next Step item text + originating session date + never appears as Completed or In Progress in any later session | Minor if 7–14d, Moderate if 15–30d, Significant if >30d |
| S4 | **Current State line stale** | Current State line references a milestone or count that older session entries have since surpassed | Moderate always; Current State should reflect latest reality |

### False Positive Avoidance

- **On Hold projects:** If Current State phase is "On Hold," suppress S1/S2/S3 severity by one level. A project intentionally paused is not stale in the same way.
- **Single-session projects:** If only one session entry exists and it's recent (<14d), do not flag S3 for its Next Steps. The user hasn't had a chance to address them yet.
- **Seasonal items:** Items explicitly tagged with a future date ("after Q1 freeze," "pending May renewal") are not stale until past their stated date.

---

## Pass 2: Blocker Escalation Analysis

**Purpose:** Identify blockers that have persisted across sessions and trace their dependency chains.

### Detection Rules

| ID | Finding | Evidence Required | Severity Logic |
|----|---------|-------------------|---------------|
| B1 | **Recurring blocker** | Same blocker (by text similarity or ticket reference) appearing in 3+ consecutive session entries | Significant always; recurring blockers need escalation or a different approach |
| B2 | **Named-owner blocker aging** | Blocker text contains a person's name + unresolved for 14+ days | Significant if 14–30d, Critical if >30d |
| B3 | **Dependency chain** | Blocker A depends on resolution of Blocker B (or a decision, or external event), chain length ≥2 | Moderate for chain length 2, Significant for chain length 3+ |
| B4 | **Blocker without owner** | Blocker entry with no named person, team, or ticket responsible for resolution | Moderate always; unowned blockers tend to persist |

### Matching Logic

Blocker recurrence matching uses fuzzy comparison:
- **Exact ticket match:** Same INC-XXXXXX number → definite recurrence
- **Semantic similarity:** Same system name + same symptom description → probable recurrence (flag with a note)
- **Keyword overlap:** Same technical term but different context → not a recurrence (do not flag)

### Escalation Signal Format

When a blocker meets B1 or B2 criteria, produce an escalation signal:

```
Significant ESCALATION: [Blocker summary]
  Persisted: [N] sessions over [M] days
  Owner: [Name or "unassigned"]
  Dependency: [What must happen to unblock]
  Last referenced: [Session date]
```

---

## Pass 3: Decision Coverage Analysis

**Purpose:** Map scope items from PROJECT_BRIEF.md to decisions in DECISIONS.md and identify gaps.

### Mapping Logic

1. Extract scope items from the Brief/Inventory file's Scope section (in-scope items only).
2. For each scope item, search DECISIONS.md entries for references by:
   - Exact name match (e.g., "EAP-TLS migration")
   - Synonym/abbreviation match (e.g., "802.1X" matches "EAP-TLS migration" if both are in scope)
   - Keyword overlap with decision Context or Decision fields (≥2 significant keywords)
3. A scope item is "covered" if at least one decision entry maps to it.

### Detection Rules

| ID | Finding | Evidence Required | Severity Logic |
|----|---------|-------------------|---------------|
| D1 | **Uncovered scope item** | Scope item text + no matching decision entry | Moderate if project phase is Planning, Significant if In Progress or later |
| D2 | **Decision without scope anchor** | Decision entry that doesn't map to any scope item | Minor informational; may indicate scope creep or missing scope item |
| D3 | **Superseded decision still active in brief** | Decision marked superseded but Brief still references the old approach | Significant always; the Brief is giving incorrect guidance |
| D4 | **Decision cluster gap** | A scope item has decisions for tooling but none for architecture, or vice versa | Minor informational; some scope items only need one type of decision |

### Coverage Ratio

```
coverage_ratio = scope_items_with_decisions / total_in_scope_items
```

Report as: "Decision coverage: [N]/[M] scope items have recorded decisions ([percentage]%)"

---

## Pass 4: Consistency Validation

**Purpose:** Cross-reference facts across all context files and project instructions to find contradictions.

### Fact Categories to Cross-Reference

| Category | Where to look | Contradiction signals |
|----------|---------------|----------------------|
| **Platform/tool names** | Brief Environment, Status entries, Decision entries, Instructions environment | Same functional role, different tool name (e.g., "Hyper-V" vs "VMware") without a decision explaining the change |
| **Server names/roles** | Brief Architecture, Status entries, Instructions Key Context | Same server name with different roles, or same role assigned to different servers |
| **Scope boundaries** | Brief Scope, Instructions Scope, Status entry tasks | Work performed (in Status) on items explicitly out of scope (in Brief or Instructions) |
| **Stakeholders/owners** | Brief Stakeholders, Status blocker owners, Decision entry context | Same person with different roles or responsibilities across files |
| **Phase/status** | Brief overview, Status Current State | Brief says "planning" but Status shows active deployment work |
| **Naming conventions** | Instructions rules, Decision entries, Status entries | Different naming patterns used in practice vs. documented convention |

### Detection Rules

| ID | Finding | Evidence Required | Severity Logic |
|----|---------|-------------------|---------------|
| C1 | **Platform contradiction** | Two files reference different tools for the same role + no decision recording the change | Significant if production-relevant, Moderate otherwise |
| C2 | **Scope boundary violation** | Status entry describes work on an out-of-scope item | Moderate always; may indicate undocumented scope change |
| C3 | **Stale Brief fact** | Brief states a fact that a more recent Status entry or Decision contradicts | Moderate always; Brief needs a clean-state update |
| C4 | **Temporal impossibility** | Status entry references completing work before its enabling decision was recorded | Minor informational; likely a recording order issue, not a real problem |
| C5 | **Naming inconsistency** | Same entity referred to by different names across files (e.g., "CORP-VHOST-05" vs "VHOST05" vs "vhost05") | Minor informational; note for standardization |

### False Positive Avoidance

- **Evolution is not contradiction.** If a Decision entry records changing from Tool A to Tool B, and Brief still says Tool A, that's a C3 (stale Brief fact), not a C1 (platform contradiction). The decision explains the change.
- **Shorthand is not inconsistency.** "CORP-VHOST-05" and "VHOST05" are the same server. Only flag C5 as informational, not as a contradiction.
- **Out-of-scope references in Status.** Sometimes ad-hoc work happens. A brief mention in a Status entry doesn't constitute scope violation if it's incidental to the main task.

---

## Pass 5: Instructions Drift Analysis

**Purpose:** Compare project instructions against current project reality in context files.

### Drift Categories

| ID | Finding | Evidence Required | Severity Logic |
|----|---------|-------------------|---------------|
| I1 | **Scope expansion** | Context files reference work areas not mentioned in instructions scope | Moderate if ≤2 areas, Significant if >2 |
| I2 | **Scope contraction** | Instructions scope includes areas with zero activity in context files across 3+ sessions | Minor informational; scope item may be deferred, not abandoned |
| I3 | **Environment divergence** | Instructions environment section references a platform/tool/version that context files show has changed | Significant if the divergent tool is actively used, Moderate if mentioned once |
| I4 | **Stale rule** | Instructions contain a rule referencing a constraint that a decision explicitly removed or changed | Significant always; stale rules cause incorrect Claude behavior |
| I5 | **Missing safety rule** | Instructions lack production safety rules but context files show production system interaction | Significant always; this is the exact scenario project-builder's infra rules guard against |
| I6 | **Audience drift** | Instructions assume a different operator skill level or role than what context files reflect | Moderate always |

---

## Pass 6: Freshservice Reconciliation

**Purpose:** Validate context file entries against live Freshservice ticket data.

### Query Strategy

1. Pull tickets assigned to operator (agent_id: {your_agent_id}) updated in last 30 days.
2. Extract all INC-XXXXXX references from context files.
3. For each referenced ticket, query its current status.
4. Identify operator-assigned tickets not referenced in any context file.

### Detection Rules

| ID | Finding | Evidence Required | Severity Logic |
|----|---------|-------------------|---------------|
| F1 | **Status mismatch: ticket resolved, context says active** | Ticket status "Resolved"/"Closed" + STATUS.md entry shows "In Progress" or "Blocker" | Significant always; context file is giving stale guidance |
| F2 | **Status mismatch: ticket active, context says complete** | Ticket status "Open"/"In Progress" + STATUS.md entry shows "Completed" | Moderate always; may indicate premature closure in context |
| F3 | **Unlinked ticket** | Ticket assigned to operator, updated in last 30 days, not referenced in any context file | Moderate if ticket priority ≤3, Minor if priority 4 (low) |
| F4 | **Phantom ticket reference** | INC-XXXXXX in context files returns no Freshservice result | Minor informational; likely a typo or deleted ticket |
| F5 | **Escalated ticket without blocker entry** | Ticket escalated or reassigned to a higher group but context files have no corresponding blocker | Moderate always; escalated tickets often indicate blockers |

### Graceful Degradation

If MCP probe fails:
- Set all F-series findings to "skipped"
- Note in output: "Freshservice MCP unavailable. Ticket reconciliation skipped"
- List all INC-XXXXXX references found in context files as informational items for manual verification
- Redistribute Ticket Alignment weight in the health score

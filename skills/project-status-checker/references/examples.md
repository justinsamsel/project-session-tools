# Examples

GOOD/BAD paired examples for findings, severity classification, output modes, and cross-skill recommendations. Consult during Steps 2–4 to calibrate quality.

---

## Finding Quality

### Staleness Finding

**GOOD:**
```
Significant: Stale In Progress item (S2)
"Deploy BitLocker to pilot group" has been In Progress since 2025-03-02 (28 days) with no follow-up in subsequent sessions.
→ Run session-context-updater to update STATUS.md. Either mark complete with enrollment count or document remaining work.
```

**BAD:**
```
Significant: STATUS.md is outdated
The project hasn't been updated recently.
→ Update the status file.
```

Why BAD: No specific item cited, no date, no day count, vague recommendation.

---

### Blocker Escalation Finding

**GOOD:**
```
Significant: Recurring blocker (B1 + B2)
"Awaiting Avery's direction on database server investigation priority" has appeared in Blockers across 4 consecutive sessions (2025-02-15 through 2025-03-15, 28 days). Owner: Avery Hale.
Dependency chain: database server crash analysis → reporting gateway refresh fix → dashboard availability
→ Escalate with Avery. This blocker has cascading impact on reporting.
```

**BAD:**
```
Moderate: Blocker about database server
database server issue is still blocked. Someone needs to make a decision.
→ Talk to management.
```

Why BAD: Wrong severity (recurring 4-session blocker is Significant minimum), no owner named, no dependency chain, no dates, vague action.

---

### Decision Coverage Finding

**GOOD:**
```
Significant: Uncovered scope item (D1)
Scope item "EAP-TLS migration" (In Progress phase) has zero recorded decisions in DECISIONS.md. The Wi-Fi upgrade is actively being built by consultant Casey Rowe, but no architectural decisions (PKI hierarchy, NPS configuration approach, certificate template design) are documented.
→ Run session-context-updater to capture PKI and NPS decisions from recent sessions. If decisions haven't been made, schedule them. Active implementation without documented architecture creates rework risk.
```

**BAD:**
```
Minor: Missing decision
There's no decision for EAP-TLS.
→ Add a decision.
```

Why BAD: Wrong severity (In Progress scope item with no decisions is Significant, not Minor), no specificity about what decisions are missing, no context about active implementation risk.

---

### Consistency Finding

**GOOD:**
```
Moderate: Stale Brief fact (C3)
PROJECT_BRIEF.md Environment section states "Entra ID joined (cloud-native, no hybrid)" but STATUS.md entry 2025-02-20 documents configuring Entra Connect Sync with PHS for DC05, and DECISIONS.md records "Hybrid identity with PHS" decision on 2025-01-15. The Brief predates these changes.
→ Run session-context-updater to update PROJECT_BRIEF.md Environment section with current identity model.
```

**BAD:**
```
Moderate: Inconsistency found
The Brief and Status files don't agree about the identity setup.
→ Fix the inconsistency.
```

Why BAD: No specific facts cited, no file sections referenced, no dates, the user can't act on "fix the inconsistency."

---

### Ticket Alignment Finding

**GOOD:**
```
Significant: Status mismatch (F1)
INC-000259 (branch office paging/printing slowness) is "Resolved" in Freshservice as of 2025-03-10, but STATUS.md entry 2025-03-08 still lists it under In Progress: "Triaging correlated Contoso branch office incidents INC-000259 and INC-000258."
→ Run session-context-updater to mark INC-000259 complete in STATUS.md and update Current State line.
```

**BAD:**
```
Moderate: Ticket mismatch
A ticket is resolved but status file says in progress.
→ Update the status.
```

Why BAD: No ticket number, no dates, wrong severity for a resolved-but-still-active mismatch, no specific STATUS.md entry cited.

---

### Instructions Drift Finding

**GOOD:**
```
Moderate: Scope expansion (I1)
Project instructions scope covers "Intune Win32 app packaging and deployment." Context files show work on Autopilot Hybrid Domain Join pre-provisioning (STATUS.md 2025-03-01), dynamic device group creation (STATUS.md 2025-03-05), and Enrollment Status Page configuration, none of which appear in the instructions' scope section.
→ Run project-builder to expand project instructions scope, or split Autopilot work into its own project.
```

**BAD:**
```
Significant: Instructions don't match
The project has done work not in the instructions.
→ Update instructions.
```

Why BAD: Over-severed (scope expansion is Moderate at ≤2 areas), no specifics about what work expanded beyond scope, no actionable recommendation.

---

## Severity Classification

### Correctly Classified

```
Critical: Blocker without owner, 45 days old, affects production database server
Significant: 3 stale In Progress items averaging 22 days, all related to active rollout
Moderate: Brief's Environment section doesn't reflect last month's Hyper-V cluster update
Minor: One STATUS.md entry uses "VHOST05" instead of "CORP-VHOST-05"
```

### Incorrectly Classified

```
Critical: STATUS.md hasn't been updated in 8 days
(Wrong: 8 days is Moderate, not Critical)

Minor: Ticket resolved but STATUS.md shows In Progress for production deployment
(Wrong: Production status mismatch is Significant minimum)

Significant: Project lacks DECISIONS.md file
(Wrong: Missing file is a completeness gap, not a significant finding, unless project is past Planning phase with active scope items)
```

---

## Dashboard Output Example (Entry Point A)

**GOOD:**
```
## Project Health: 74/100

| Dimension | Score | Key Finding |
|-----------|-------|-------------|
| Freshness | 62 | STATUS.md last updated 16 days ago; 3 stale items |
| Completeness | 91 | All files present; Architecture section thin |
| Decision Coverage | 70 | 2/6 scope items lack decisions (EAP-TLS, AD lifecycle) |
| Consistency | 95 | No contradictions detected |
| Ticket Alignment | 55 | 2 tickets resolved in FS but still "In Progress" |
| Instructions Alignment | 78 | Scope expanded beyond instructions in 2 areas |

Scored: 6/6 dimensions

---

### Findings

**Significant**
- 3 In Progress items stale 16–28 days (BitLocker, branch office incidents, warehouse Wi-Fi), STATUS.md, sessions 2025-03-02 through 2025-03-14 → run session-context-updater
- INC-000259 resolved in Freshservice but In Progress in STATUS.md → STATUS.md 2025-03-08 entry → run session-context-updater
- "EAP-TLS migration" in active deployment with no recorded decisions → DECISIONS.md gap → capture PKI/NPS decisions

**Moderate**
- PROJECT_BRIEF.md Environment still says "cloud-native, no hybrid" despite Entra Connect Sync deployment → run session-context-updater
- Project instructions scope doesn't include Autopilot work reflected in STATUS.md → run project-builder

---

### Prioritized Actions

**Significant**
1. Run session-context-updater, resolves 4 findings (3 stale items, 1 ticket mismatch, 1 stale Brief fact)
   Skill: session-context-updater | Can act now
2. Capture EAP-TLS architectural decisions, coverage gap on active deployment
   Skill: session-context-updater (targeted) | Can act now

**Moderate**
1. Run project-builder, scope expanded beyond instructions in 2 areas
   Skill: project-builder | Can act now
```

---

## Resume Snapshot Example (Entry Point C)

**GOOD:**
```
**infra-rollout** · Health 74/100 · 4 items need attention

**Recommended First Move**
**Enroll the next 10 workstations in the BitLocker pilot (18/60 done).**
*Why:* the rollout is the project's purpose and has sat for 28 days, so momentum is the main risk.

**State signals**
- BitLocker In Progress since 2025-03-02, no entry since
- database server blocker open 4 sessions, waiting on Avery
- EAP-TLS work active with no PKI/NPS decision recorded
```

Then one popup. Options: **Enroll the next 10 workstations (Recommended)**; Record the EAP-TLS architecture decisions (15 min); Chase Avery on database server priority.

---

## Stakeholder Briefing Example (Entry Point D)

**GOOD:**
```
## 2025-03-30

**This Week**
- BitLocker deployment at 18 of 60 workstations, targeting completion by mid-April
- Contoso branch office printing issues (INC-000259, INC-000258) resolved
- Wi-Fi upgrade and EAP-TLS authentication build progressing with Casey Rowe

**Security Remediations**
- Remediated phishing SVG attachment on Contoso workstation; session revoked, password reset

**To Do**
- Need direction from Avery on database server investigation priority vs. other projects
- Document certificate authority architecture before Wi-Fi auth rollout expands
- Complete BitLocker pilot group enrollment
```

---

## Cross-Skill Recommendation Examples

**GOOD (Deduplicated):**
```
1. Run session-context-updater, resolves S2, S3, C3, F1 (3 stale items, 1 stale Brief fact, 1 ticket mismatch)
   Skill: session-context-updater | Can act now | Scope: STATUS.md staleness + PROJECT_BRIEF.md Environment section
```

**BAD (Redundant):**
```
1. Run session-context-updater to fix stale BitLocker item
2. Run session-context-updater to fix stale branch office incident item
3. Run session-context-updater to fix stale warehouse Wi-Fi item
4. Run session-context-updater to update ticket status for INC-000259
5. Run session-context-updater to update Brief's identity model
```

Why BAD: Five separate recommendations for one skill invocation. Deduplicate into a single entry listing all resolved findings.

---

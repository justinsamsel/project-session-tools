# Capture (wrap-up)

Single home for extraction, file shapes, and auto-mode staleness. Load on Entry Points A, B, C (and D for extraction only).

**Section index**

| Section | When |
|---|---|
| Extraction | Always on A/B/C/D |
| File shapes | Before writing BRIEF / STATUS / DECISIONS |
| Staleness (auto) | Step 1 on A/B/C |
| Ask mode | Only when `write_mode: ask` |

Do not load resume files from here. Primer generation is `next-session-prompt.md` after the write.

---

## Extraction

**Priority (high to low):** corrections and reversals; decisions with rationale; error resolutions (symptom + fix); environment facts; status milestones; stated next steps.

**Do not extract:** greetings and filler; talk about this skill or Claude; speculation with no decision; generic knowledge; full scripts (name the artifact instead); facts already in the files that did not change; pre-existing `CLAUDE.md` on ordinary wrap-up; "refresh instructions" / "hand-edit CLAUDE.md" chores from noticing Role/Tone drift.

**One file per item.** Dual signal: choice with rationale → Decisions. Temporal event → Status. Never write the same item to both.

### Confidence (internal)

| Level | Tag | Criteria |
|---|---|---|
| High | `[✅ high]` | User stated, decided, or directly confirmed. Corrections are always high. |
| Medium | `[💡 medium]` | User confirmed a suggestion, or a fix that "worked." |
| Low | `[⚠️ low]` | Inferred or artifact-only. Silence is not confirmation. |

When unsure between medium and low, choose low. Artifact-sourced items start low and get `[from artifact: filename]`. Auto mode writes high and medium non-conflicting items only. Low and conflicts go to Skipped. Do not print confidence tags into STATUS, DECISIONS, or BRIEF.

### Classification

**Brief (clean-state, no dates on facts):** durable truth. Describes what IS.

| Signal | Example |
|---|---|
| Platform or version | Exchange is running 2019 CU14 |
| Path or topology | Site reaches Azure via ExpressRoute |
| Architecture / dependency | Reporting gateway runs on CORP-DB-01 |
| Scope boundary | Remote offices are out of scope |
| Constraint | Intune IME requires 32-bit PowerShell 5.1 |
| Stakeholder | Casey Rowe owns the EAP-TLS migration |
| Access or naming | Devices rename to CORP-{SerialNumber} |

**Status (dated journal):** what happened or needs to happen.

| Signal | Example |
|---|---|
| Completed | Deployed BitLocker GPO to the pilot group |
| Verification | `repadmin /replsummary` shows no failures |
| Blocker | STORAGE volume on VHOST05 at 92% |
| Action item | Need after-hours verification |
| Priority shift | Pausing SQL; focus is branch incidents |

**Decisions (append):** a choice among alternatives with reasoning.

| Signal | Example |
|---|---|
| Explicit choice | EAP-TLS over EAP-PEAP (no password dependency) |
| Tool / approach | PDQ Connect instead of Intune Win32 |
| Rejection with why | Ruled out cloud-only Autopilot; hybrid join required |
| Policy or scope | BitLocker on workstations only; servers excluded |

### Artifacts

After the conversation, scan files created or modified this session. Extract the fact, not the code. Drop if the conversation already captured it. Default confidence low, tagged `[from artifact: filename]`.

| Artifact | Extract |
|---|---|
| Scripts | Server names, OU paths, accounts, ports |
| IaC / JSON / YAML | Resource names, endpoints, versions, flags |
| Runbooks | Contacts, escalation, procedure names |

### Project instructions

Map `CLAUDE.md` (or equivalent) **only** when this session drafted or changed those instructions, or on bootstrap (B) with no trio yet. Ordinary A/C wrap-up does not read or extract pre-existing instructions.

When mapping applies:

| Instructions | Target |
|---|---|
| Role | Brief Overview |
| Scope (in) | Brief Scope |
| Scope (out) | Brief Constraints |
| Key Context | Brief Environment / Architecture |
| Rules | DECISIONS only if they encode a choice; never paste rule text |
| Knowledge Base refs | Brief Key References |

Prefer conversation confidence. Do not copy reference-file contents into the trio. Do not add a Next Step, primer line, or offer to refresh or hand-edit `CLAUDE.md`.

### Conflicts and dedup

Explicit supersession → update and mark the old content. Ambiguous conflict → skip the write, list under Skipped. Prefer the more precise wording. Prefer conversation over artifact.

---

## File shapes

### PROJECT_BRIEF.md

Living snapshot. Required: title, Overview, Scope, Environment. Conditional: Architecture, Stakeholders, Constraints, Key References (omit when empty).

Edit only sections that changed. Replace the old fact; do not timestamp facts; do not drop a section unless the session declared it irrelevant.

### STATUS.md

Required: title, **Current State** (one-liner + overall phase: Planning / In Progress / Blocked / Testing / Validation / Complete / On Hold / Cancelled). The one-liner must be specific. `status_write` places the Current State and the dated block; you supply the content.

Dated entry shape:

```markdown
## YYYY-MM-DD, [Brief Session Label]

**Completed:**
- [Item]

**In Progress:**
- [Item]

**Blockers:**
- [Item]

**Next Steps:**
- [Item]
```

Omit empty subsections. Each bullet must be actionable without follow-up questions (name the system, ticket, path, or outcome).

**Anti-bloat:** short entries (typically 8 bullets or fewer). Never re-paste a prior session block. Unique decisions belong in DECISIONS.md, not repeated here. When `status_write` reports `bloat.needed`, condense with `status_condense` (one-line outcome per folded date).

### DECISIONS.md

`decision_append` writes the entry: title, date, **Context**, **Decision**, **Alternatives considered**, **Implications**. Never delete old entries. When a decision replaces an old one, pass `supersedes` and name the old decision in the new Context.

---

## Staleness (auto)

`stale_items` finds them. If this session clearly completed or cancelled an item, apply that; otherwise leave it. List the oldest (max 3, with their dates) under **Heads up** on the summary card. No interactive review.

---

## Ask mode

Load this section only when `write_mode: ask`.

Before writing, present: stale-item picks; per-file change bullets with confidence tags; a numbered manifest coverage table; sweep line if Step 2.5 ran; diffs for BRIEF section edits, Current State overwrite, and decision supersession (skip diffs for pure appends); conflicts as picks. Wait for approval.

Stale picks: Still active / Completed / No longer relevant / Blocked.

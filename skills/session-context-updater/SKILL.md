---
name: session-context-updater
metadata:
  version: "2026.10.30.1"
description: "Capture session context into PROJECT_BRIEF.md, STATUS.md, and DECISIONS.md, then refresh the next-session primer. This is the End of a work session. SCOPE GATE: code and IT project work only. Engage when the working folder is a project (a context/ folder, a project-level CLAUDE.md, or a git repo root), or when the user names a project or ticket folder under projects/ or tickets/ from the vault root. In a personal-vault, family, notes, or finance session that names none, do not engage; note-taking there belongs to the user's own notes, and there are no context files to write. END triggers: 'end session', 'session end', 'wrap up', 'wrap this session', 'close out this session'. Prefer this skill over ad-hoc 'I'll update STATUS myself'. Opening a session ('start') belongs to project-status-checker, not this skill."
---

# Session Context Updater

Write engine for project continuity, and the **End** of a work session. Default is auto-write after extraction. After A/B/C writes that change BRIEF, STATUS, or DECISIONS, regenerate `context/prompts/next-session/latest.md`. Entry Point A is the wrap: capture, primer, commit, focus pin, backup when the project requires it, then one summary card. Opening a session (Start) is `project-status-checker` Entry Point C.

## Bundled References

| File | When to load |
|---|---|
| `references/capture.md` | Entry Points A, B, C (extraction + file shapes + auto staleness). D: extraction only |
| `references/vault-context.md` | A, B, C, H (frontmatter). Skip D, E, F, G |
| `references/shared-conventions.md` | A, B, C (naming, layout, no registry) |
| `references/next-session-prompt.md` | After A/B/C writes that changed BRIEF, STATUS, or DECISIONS. Primer generation only |
| `references/file-templates.md` | Entry Point B, and H if a file is missing |
| `references/bootstrap-features.md` | Entry Point B, and H for custom sections. Not on A/C |
| `references/legacy-project-compat.md` | Entry Point H only |
| `references/digest-mode.md` | Entry Point D, or when the user asks for a shareable digest |
| `references/resume-experience.md` | Bootstrap / low-context start / explicit resume / builder Fast/Deep accept only |
| `references/examples.md` | Revision requests only |
| `references/no-server.md` | Only when the `project-session-tools` tools are not listed |

Do **not** load `resume-experience.md` for ordinary wrap-up or primer regen. Do **not** load `bootstrap-features.md` on A/C. There are no other resume refs.

## MCP Tools (use first when present)

The `project-session-tools` MCP server places STATUS and DECISIONS writes, keeps STATUS in shape, and finds stale items (the tools keep these bare names behind any prefix, such as `mcp__project-session-tools__project_snapshot` or a plugin's `mcp__plugin_project-session-tools_...__project_snapshot`; load them through ToolSearch if deferred). Extraction, wording, BRIEF edits, the primer, the card and the commit stay with you. **Tools not listed:** load `references/no-server.md` and do those steps by hand; the files must come out the same.

| Tool | Does |
|---|---|
| `stale_items` | Step 1.4 staleness scan |
| `status_write` | Step 4 STATUS: Current State, new dated block (or merge into today's same-label block), frontmatter. Returns `replacedCurrentState` and `bloat` |
| `status_condense` | Only when `bloat.needed` lists `bloat.wouldCondense`; pass a one-line outcome per date |
| `decision_append` | Step 4 DECISIONS entry, Superseded marker via `supersedes` |

`currentState` replaces the whole section: carry forward lines still true, then check `replacedCurrentState` for anything live you dropped. If `bloat.reasons` says too few dated entries to fold, trim by hand only when the session touched that section; otherwise name it under **Heads up**. Commit the `path` each tool returns (Step 6): the commit guard does not see MCP writes. Tool results already confirm headings, so skip the Step 6 audit grep for those files.

## Config (inline)

Scan context files for `<!-- session-context-config`. If missing or malformed, use defaults. Do not load `bootstrap-features.md` just to parse this.

| Key | Default | Meaning |
|---|---|---|
| `write_mode` | `auto` | `auto` = write then summarize. `ask` = pre-write approval |
| `staleness_threshold_days` | `14` | Open Next Steps / In Progress older than this |
| `resume_behavior` | `ask` | `ask` / `auto` / `never` (resume paths only) |
| `resume_mode` | `ask` | Fast / Deep preference (resume paths only) |
| `resume_prompt_max_age_days` | `30` | Ignore older primers on resume |

## Interaction Style

AskUserQuestion for bounded choices (ambiguous entry point, archive confirm, `write_mode: ask` gates). Auto mode does not stop for extraction approval.

## Core Principles

1. **Signal over noise.** Extract only what would change a future session.
2. **Additive, not destructive.** Do not remove content unless the session supersedes it. STATUS condense is the exception.
3. **Temporally aware.** STATUS is dated. Decisions include when. BRIEF is current truth, no dates on facts.
4. **Auto-write.** High and medium non-conflicting items write immediately. Low-confidence and conflicts are skipped.

## Context files

| File | Role | How to update |
|---|---|---|
| PROJECT_BRIEF.md | What is true now | Edit only sections that changed |
| STATUS.md | What happened / happens next | Edit Current State in place; insert a new dated block newest-first |
| DECISIONS.md | Choices with rationale | Append at the bottom; mark superseded entries in place |

If existing files use other names, map by content. Prefer `context/` then flat root.

## Environment

Writable disk (Code / vault): write files in place. No local `context/backups/*.bak-*`. Restore path is git history and the private GitHub backup.

If you cannot write to disk: emit the updated files as downloadable content and say so once.

## Entry Points

### A: Update existing files

Primary wrap-up. **Load:** `capture.md` + `vault-context.md` + `shared-conventions.md`.

### B: Bootstrap

No context files. **Load:** A's set + `file-templates.md` + `bootstrap-features.md`.

### C: Selective update

Same loads as A. Manifest covers the whole session; items outside the asked scope collapse to one summary line.

### D: Digest only

**Load:** `capture.md` (extraction) + `digest-mode.md`. No file writes, no manifest, no primer.

### E: Quick Capture

**Load nothing.** One statement → classify → write → one-line confirm. See workflow below.

### F: Archive

Confirm first. Final STATUS line. Frontmatter `status: archived`. Folder stays. Do not create `PROJECT_REGISTRY.md`.

### G: Un-archive

Frontmatter `status` back to an active phase. Suggest project-status-checker.

### H: Upgrade

**Load:** `legacy-project-compat.md` + `vault-context.md` + `file-templates.md` (missing files only) + `bootstrap-features.md`. Create only what is missing. Default `write_mode: auto` if adding config. Upgrade is optional; A–E must work without it.

---

## Step 1: Detect

1. **In-vault.** If `vault-context.md` is loaded, set `in_vault` from `%APPDATA%\obsidian\obsidian.json` as that file describes.
2. **Inventory (scoped).** Read `context/PROJECT_BRIEF.md`, `context/STATUS.md`, and `context/DECISIONS.md` (or flat-root equivalents). Classify by content if names differ. A root `CLAUDE.md` is instructions by name: do **not** read its body on ordinary A/C wrap-up. Read it only if this session drafted or changed project instructions, or this is bootstrap (B) with no trio yet. Walk the rest of the tree **only** if a Brief, Status, or Decisions role is still missing. Do not open `notes/`, `work/`, `archive/`, `docs/`, or `skills/` on a normal wrap-up. Read all three files in one message as parallel Read calls, and send `stale_items` (item 4) in that same message when a Status file exists.
3. **Config.** Parse `<!-- session-context-config` from those files using the table above.
4. **Staleness.** If a Status file exists, `stale_items`. Auto: apply only clear completions/cancellations from this session.
5. **Empty?** Offer bootstrap only when there are zero project markdown files. If files exist but roles are unclear, ask once.
6. **Legacy lag.** Use graceful defaults and continue wrap-up. Do not offer Entry Point H. Do not load `legacy-project-compat.md` unless the user asked to upgrade or this is H.

Do not create or update `PROJECT_REGISTRY.md`.

**Resume hook (not wrap-up):** On bootstrap, low-context A/C, or explicit resume, load `resume-experience.md` only if a fresh `latest.md` may apply. Silent if none. Never block the update path.

## Step 1.5: Manifest (internal)

Build a numbered list of session events (completed, decided, discovered, blocked, corrected, next step, scope change, artifact). Auto mode: do not print it, do not ask for confirmation. Carry it through the run. It feeds the summary card (Step 7); do not print counts.

## Step 2: Extract

Load `capture.md` if this entry point listed it. Scan the conversation (and session artifacts). Classify per `capture.md`. Tag confidence internally. Do not write confidence tags or `[manifest #N]` into context files.

Corrections are always high. Preserve exact values (names, paths, tickets, error codes). Do not fabricate. Do not extract meta-conversation.

## Step 2.5: Entity sweep (conditional)

Run after extraction on A/B/C **only** when this session reversed a decision or changed a BRIEF fact. Do not sweep because several environment facts appeared, or because BRIEF lists related systems.

Search BRIEF, STATUS, and DECISIONS for those entities. Do **not** search or patch `CLAUDE.md`. Flag stale references (Deferred but resolved, In Progress but completed, BRIEF fact changed). Add hits as high-confidence extractions. Report stale hits under **Heads up** on the card. If the trigger is not met, skip silently.

## Step 3: Write package

**Auto:** write high and medium non-conflicting items. Skip low-confidence, conflicts, and anything that needs a guess. Never auto-apply to other projects. Do not wait for approval.

**Ask:** present the Ask-mode section of `capture.md` and wait.

## Step 4: Generate

STATUS and DECISIONS go through the tools (see MCP Tools). Make every other context-file write as a **region edit** with the host's file tools (Edit / Write), never a shell script, heredoc, or `python -c`: a file-tool call names the path it wrote, and commit tooling uses that to tell this session's work from another session's.

**Batch the writes.** Once the package is decided, send every independent write (each BRIEF region edit, the frontmatter edit, `status_write`, `decision_append`) in one message as parallel tool calls. Each Edit still matches its exact old text; a failed match fails only that edit, so fix and resend that one. When the package changes the trio, load `references/next-session-prompt.md` in that same message so the primer can be written right after.

- **BRIEF:** edit only the heading/section that changed.
- **Frontmatter (in-vault):** refresh `last-updated`; set `status` from phase when known; preserve `health`/`last-check` (checker-owned) and unknown user fields. No frontmatter when not in-vault.

Self-check before writing: roles mapped; facts→Brief, events→Status, choices→Decisions; exact values; no silent overwrite of conflicts; dates YYYY-MM-DD; empty STATUS subsections omitted; every manifest item has a disposition; no duplicated quick captures; no registry file; no `CLAUDE.md` write; no instruction-refresh Next Step.

## Step 5: Deliver

Write `{cwd}/context/` in place (or emit downloadable files if disk is not writable). Do not dump diffs in auto mode. The only user-facing summary is the card in Step 7.

Bootstrap also: one-time note that these files are the continuity layer; offer the auto-trigger snippet from `bootstrap-features.md` **on B only**.

## Step 6: After write (A/B/C)

Send the Audit greps, the primer write and the focus-pin edit in one message when none depends on another's result.

**Audit:** Grep delivered files for the new dated STATUS heading (`## YYYY-MM-DD`) and any new DECISIONS heading. Do not re-read whole files. Do not read the memory directory.

**Primer:** If this run changed BRIEF, STATUS, or DECISIONS content, load `references/next-session-prompt.md` and write `context/prompts/next-session/latest.md` only. Do not write a dated copy. Do not load resume refs. If nothing in the trio changed, skip.

**Focus pin:** if `work/CURRENT.md` exists and its focus item is done, clear or update the pin with Edit; if the item is still active, leave it. Count the file as written by this run for the commit below.

**Commit:** if the project folder is a git repo, commit the files this run wrote (trio + `latest.md` + `work/CURRENT.md` if the pin changed), and only those: `git add <those paths>` then `git commit` with a real message (`context: <what the session did>`). Leave other dirty files alone and name them under **Heads up**. Not a repo, or `write_mode: ask` without approval: skip. No push; pushing belongs to project backup rules. A Quick Capture (E) commits the one file it touched the same way.

**Daily note:** if the instructions in context (a global, vault, or project `CLAUDE.md`) name an end-of-session daily-note skill, run it after A/B/C capture in this same turn, even when the trio did not change. Route daily-worthy items into that calendar day’s note. Default date is today unless the user named another date. Skip when no such skill is named or nothing is daily-worthy. Do this before the summary card. Footer chip: `` `Daily {YYYY-MM-DD|skipped}` ``.

**Backup:** only when the project instructions already in context (its `CLAUDE.md`; do not open the file to find out) require an end-of-session backup, and project files changed this session: run the backup command those instructions name after the commit and the daily note. Never force-push. Footer chip: `` `Backup {sha|already current}` ``, added last, only when a backup ran.

**Do not:** offer a digest unless the user asked; offer the auto-trigger snippet on A/C; read or write `.context-cache.md`; write `PROJECT_REGISTRY.md`; offer a `CLAUDE.md` refresh or hand-edit.

## Step 7: Summary card (A/B/C)

Print this card last, once, and nothing after it. No emojis. When a backup ran (Step 6), print the card after it so the footer carries the SHA.

```
---

**{project}** · session captured · {YYYY-MM-DD}

**Done**
- {completed item, one line}

**Decided**
- {decision, one line}

**Heads up**
- {blocker, stale Next Step with its date, or skipped conflict}

**Next move**
{primer First Move, verbatim}
*Why:* {primer reason}

`STATUS {change}` · `DECISIONS {change}` · `BRIEF {change}` · `Primer {refreshed|skipped}` · `Commit {sha|skipped}` · `Daily {YYYY-MM-DD|skipped}` · `Backup {sha|already current}`

---
```

| Rule | Detail |
|---|---|
| Title | Resolved project name, not a fixed label |
| Done | Max 5. Past that: `- +N more in STATUS` |
| Decided / Heads up | Max 3 each. Omit the section when empty |
| Bullets | One line each, a few words, exact values in inline code |
| Next move | Always present when files were written. Copy the primer line; if no primer folder, use the top STATUS Next Step |
| Footer | Every trio file listed: `+entry`, `+N`, `updated`, or `no change`. Paths only for newly created files. `Commit` is the short SHA, or `skipped` when the folder is not a repo. `Daily` is the daily-note date, or `skipped`. `Backup` appears only when a backup ran. Skipped low-confidence items: append `` `Skipped N` `` |

Nothing written: print one line, `**{project}** · nothing to capture · primer unchanged`. Quick Capture (E) keeps its one-line confirm, no card.

---

## Quick Capture (Entry Point E)

Trigger phrases: "quick capture", "jot this down", "note that", "log this", "capture: [statement]".

1. If no statement, ask "What should I capture?"
2. Classify:

| Signal words | Target |
|---|---|
| decided, going with, chose, ruling out | DECISIONS.md |
| completed, finished, deployed, fixed, resolved | STATUS → Completed |
| blocked, waiting on, can't proceed, stuck | STATUS → Blockers |
| next, need to, todo, follow up, should | STATUS → Next Steps |
| found, discovered, confirmed, turns out, environment | PROJECT_BRIEF.md |
| unclear | Ask: decision, status, or environment fact? |

3. Write immediately. Tag `[quick capture]`. STATUS: append to today's entry or create a minimal dated entry. DECISIONS: title + `**Decision:**` line. BRIEF: matching section, or append with `<!-- needs classification -->`.
4. Commit that one file if the folder is a git repo (Step 6 rule).
5. Confirm: `Added to [file] → [section]: [item]`.

If no context files exist, fall back to B. Quick Capture skips Steps 1–6 (except the commit) and all reference loads.

---

## Rules

1. Never fabricate context. Preserve exact values. Never extract meta-conversation.
2. Never conclude "no context files" when project markdown exists. Classify by content.
3. Default `write_mode: auto`. Write high/medium non-conflicting items. Skip low and conflicts.
4. Do not create local bak copies. Region Edit, not whole-file Write, except STATUS condense. File tools only, never shell writes. Commit what you wrote when the folder is a git repo.
5. STATUS anti-bloat is mandatory: short entries, no re-paste, condense when bloated.
6. Regenerating `latest.md` after trio content changes is mandatory. Primer regen is not a resume path.
7. Load `resume-experience.md` only for bootstrap / low-context / explicit resume / builder Fast/Deep accept.
8. Never auto-apply cross-project updates. Never create `PROJECT_REGISTRY.md`.
9. Never require a modern layout to capture. Upgrade is optional (H) and only when the user asked.
10. Writing style: no em dashes or double hyphens as interrupters. Tables and short bullets. High-signal output.
11. Stay on the asked wrap-up. Do not offer H, a digest, a checker run, insights, a `CLAUDE.md` refresh, a hand-edit of instructions, or a new slice after capture. Primer regen is the job. `CLAUDE.md` is out of wrap-up write scope. Instruction drift is not a Next Step.
12. When the instructions name a daily-note skill, always run it after A/B/C (Step 6 Daily). The summary card still prints last.

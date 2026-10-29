# Without the MCP server

Load this only when the `project-session-tools` tools are not listed. Each section is the by-hand version of one tool. The files must come out the same as on the tool path. Write with the host's file tools (Edit / Write), never a shell script.

## Staleness (replaces `stale_items`)

Open Next Steps / In Progress from earlier entries older than `staleness_threshold_days` (default 14), and Blockers older than 7 days, that no newer entry mentions again. Skip the newest entry and projects On Hold or Cancelled. Oldest first. Then apply `capture.md` Staleness.

## STATUS write (replaces `status_write`)

- Overwrite the Current State section in place (one-liner + phase). Carry forward any line that is still true.
- Insert the new dated block (`## YYYY-MM-DD, Label`) immediately below Current State, newest first. If today's block with the same label exists, merge into it instead.
- In-vault frontmatter: refresh `last-updated`, set `status` from phase when known, keep `health` / `last-check` and unknown fields.

## Anti-bloat condense (replaces `status_condense`)

Fires when STATUS is over about 120 lines, the same dated heading repeats, or Current State is buried. Keep Current State and the newest 6 entries (5 if 6 still leaves it over 120 lines). Rewrite STATUS as one file: fold the older dated entries into one-line outcomes per date in the history section, keep history rows verbatim (including range rows like `2026-06-15–16`), keep line endings, and keep the history section where it is.

## DECISIONS append (replaces `decision_append`)

Place the new entry after the newest existing entry in that format (below any old-format list), at the file's own heading level:

```markdown
### [Decision Title], YYYY-MM-DD

**Context:** [Why this came up]
**Decision:** [What was decided]
**Alternatives considered:** [What was rejected and why]
**Implications:** [What this means next]
```

When superseding, add `**Superseded:** YYYY-MM-DD, see "[new title]"` under the old entry (in-place edit).

## Audit

Grep the delivered files for the new `## YYYY-MM-DD` STATUS heading and any new DECISIONS heading. Do not re-read whole files.

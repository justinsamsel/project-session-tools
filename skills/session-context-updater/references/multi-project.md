# Multi-Project Wrap-up (Entry Point I)

Load only on Entry Point I. A session that named two or more projects or tickets wraps every project in the set in one run and prints one card. Single-project wrap-up (A) does not change.

## 1. Resolve the set

1. **Capture file first.** If the instructions in context name a session capture folder, look there for today's files whose `Set:` line names this session's projects and that this session created or appended to (the write appears in this conversation), and use the one modified most recently (by file time, never by name). A file this session never wrote is an earlier session's and is ignored. The `Set:` line is the set.
2. **Else the conversation.** The projects or tickets the user named at the start of the session are the set.
3. Resolve every member with `project_snapshot`, all in one parallel message. A member that does not resolve is named under **Heads up** and skipped; the rest still wrap.
4. **Never write outside the set.** An item that belongs to a project outside the set is not written anywhere; name it under **Heads up** as `outside the set, not written`.

## 2. Source

- **Capture lines are the primary source.** Each line is `[project] finding|decision|next|done: text (source)`. The tag is the proposed owner, `decision` maps to DECISIONS, `finding` to BRIEF or STATUS per `capture.md`, `next` to STATUS Next Steps, `done` to STATUS Completed.
- **Fill gaps from the conversation.** Anything the session did that has no capture line is extracted the normal way (`capture.md`). Anything a capture line says that the conversation contradicts follows the conversation; a correction is always high confidence.
- **No capture file:** extract from the conversation alone and add `Capture file missing` under **Heads up** once.

## 3. Route

Build one routing table, item to owning project, and print it before writing:

| # | Item | Project | File |
|---|---|---|---|

- **One owner per item.** An item that fits two projects is written in full to one owner, and the other gets a one-line pointer in its STATUS entry: `See <owner project> STATUS <YYYY-MM-DD>: <a few words>`.
- **Ambiguous items** (tag missing, tag outside the set, or two equally good owners) go to the user as one AskUserQuestion popup, one question per item, up to four per popup, recommended owner first. Do not write an ambiguous item until it is answered.
- Unambiguous items do not wait. Auto mode still applies per project.

## 4. Write, per project

Run Steps 1 to 6 of Entry Point A for every member, batched across the set:

1. **Read:** every member's trio plus `stale_items`, all in one parallel message.
2. **Write:** every `status_write`, `decision_append` and BRIEF region edit for every member in one parallel message. Each call carries its own `project`.
3. **Primer:** regenerate `latest.md` for each member whose trio changed, per `next-session-prompt.md`. Create `context/prompts/next-session/` when it does not exist; a missing folder is never a reason to skip. A member whose `status` is `archived`, or that the instructions say gets no primer, is skipped.
4. **Commit:** per member, only when that member's folder is a git repo.
5. **Daily note:** once for the whole session, not once per member.
6. **Audit:** one grep per member for its new dated STATUS heading.
7. **Post-wrap check:** when the instructions in context name a post-wrap check command, run it after the writes and before the card, and put every FAIL line under **Heads up** verbatim. A check that cannot run (no verdict) goes under **Heads up** as `Post-wrap check did not run: <reason>`. None named: skip.

## 5. One card

Print one card last, with a section per member in set order:

```
---

**Multi-project** · session captured · {YYYY-MM-DD} · {N} projects

### {project 1}
**Done**
- {item}
**Decided**
- {item}
**Next move**
{primer First Move, verbatim}

`STATUS {change}` · `DECISIONS {change}` · `BRIEF {change}` · `Primer {refreshed|skipped}` · `Commit {sha|skipped}`

### {project 2}
...

**Heads up**
- {cross-member pointer written, outside-the-set item, unresolved member, missing capture file}

`Daily {YYYY-MM-DD|skipped}` · `Routed {N}` · `Asked {N}` · `Check {PASS|FAIL N|did not run|skipped}`

---
```

Per-member sections follow the Step 7 limits (Done max 5, Decided max 3) and omit empty sections. Heads up is shared, max 5. A member with nothing written gets one line: `### {project}` then `nothing to capture · primer unchanged`.

## Rules

- The capture file is read, never edited or deleted.
- No cross-member write without a routing row. No write to a project outside the set, ever.
- Entry Point I does not rank the members or suggest which to work next. Each member's Next move comes from its own primer.

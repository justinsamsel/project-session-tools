# Summary Digest Mode

**Purpose:** Produce a concise, portable session summary suitable for pasting into Teams, Slack, a Freshservice ticket note, or similar communication channel, alongside or instead of the file updates.

**When it activates:** Entry Point D, or when the user requests "give me a summary I can share" / "summarize this session for a ticket" / "digest mode" during a normal update flow.

## Entry Point D: Digest Only

The user wants a shareable summary but not file updates. Skip Steps 3–5 (write package, generation, delivery) and instead produce only the digest output after Step 2 (Extract).

## Digest Alongside Updates

When running a normal update (Entry Points A–C), offer the digest as an additional output after delivering the updated files: "Want a digest summary you can paste into Teams/Freshservice?"

## Digest Format

```
## Session Summary, YYYY-MM-DD

**Project:** [Project name]
**Session focus:** [1-line description of what this session was about]

**Key outcomes:**
- [Outcome with specifics]
- [Outcome with specifics]

**Decisions made:**
- [Decision: one-line summary with rationale]

**Open items:**
- [Item with owner/timeline if known]

**Blockers:**
- [Blocker with what's needed to unblock]
```

## Digest Rules

- Keep the digest under 20 lines. It should fit in a Teams message or ticket note without scrolling.
- Use plain text. No markdown headers, tables, or formatting that won't render in the target channel. Bold is OK for section labels.
- Include only the top 3–5 outcomes/decisions/items. If the session produced more, prioritize by impact.
- The digest is a communication artifact, not a context file. It does not need to be comprehensive; it needs to be useful to the recipient.
- Ticket note variant: When the user says "for a ticket" or references a ticket number, adjust the format to focus on what was done and what's next (skip decisions unless they directly affect the ticket).

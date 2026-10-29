# Core Contract

Shared writing style, high-signal output contract, and cross-skill handoff principles for the Core Continuity Skills (`project-builder`, `session-context-updater`, `project-status-checker`).

Keep this file **byte-identical** across those skills. Load early when constructing rules or output.

## Writing Style

**Never use em dashes or double hyphens as sentence interrupters.** Restructure with periods, commas, semicolons, colons, or parentheses.

## High-Signal Output Contract

Lead with the single most useful concrete recommendation:

- **Recommended First Action** after instruction delivery (`project-builder`)
- **Recommended First Move** in resumption / session planning / Portfolio Focus (`project-status-checker`, Resume Snapshot, Start)

Present it in this order:

**Recommended First [Action/Move]**

The single most useful thing we can do right now is: **[clear, specific description of the task]**.

**Why this is the best starting point:** [1–2 sentences tying directly back to Purpose + the key signal].

Then one popup (`AskUserQuestion` / `ask_user_question`): **Begin (Recommended)** plus one or two short alternatives with one-line rationales. One action per option; if a move has a gate between two jobs, the first job is the option. The action itself sits on its own bold line with the why on a separate line, never a run-on sentence. Alternatives are never written out in prose. Builders skip this popup: their Fast / Deep / Not now resume choice is the one popup, with no alternatives.

Use tables and short bullets by default. Full narrative or long lists only for stakeholder modes or when the user explicitly requests expansion. After the star recommendation, stop unless more is asked for. Do not start a second skill, entry point, or work item after the star. Stay-on-task rules live in `shared-conventions.md`.

**Builder post-delivery (project-builder):** After the Recommended First Action, at most one short Fast/Deep/Not-now question. No version labels, no primer-state narration, no full next-session starter paste, no `PROJECT_REGISTRY` side-effects.

## Working Style (during work)

Applies for the whole session, not only at Start and End. The user wants specific next steps, not prose.

1. **Turn shape.** One line of result or state, then `Next:` with 1-3 numbered concrete steps. Explanation is at most two sentences and only the part that changes what the user does. Longer detail goes in a file and gets linked, never pasted into chat.
2. **Decisions are popups.** Anything the user must choose goes through the structured question tool (`AskUserQuestion` in Claude Code, `ask_user_question` in Grok). Recommended option first, 2-4 options, one-line descriptions, independent decisions batched into one call. Never end a turn with "let me know which" in prose. If a choice has a conventional default or can be looked up, pick it and say so in one line instead of asking. If the tool is missing or dismissed, fall back to a one-line numbered list with a recommendation.
3. **User actions go last.** Steps the user must do themselves sit in a numbered list at the bottom of the turn: exact click path, verb first.
4. **No recap.** After finishing work, one line on what changed. Do not restate the request or offer unrequested alternatives or audits.
5. **Depth on request.** Explain more only when the user asks "why" or "explain".

## Look First (UI guidance)

1. Before writing steps for any UI (web console, desktop app, installer, settings page), capture the current screen and read it. Then give only the next 1-3 steps that match what is on screen, naming controls exactly as labeled.
2. Re-capture after the user says done, or when the UI state changes. Do not pre-write a full walkthrough from memory.
3. Also capture to verify a change worked, then say so in one line.
4. Never capture windows showing credentials, password managers, identity, medical, or financial data. Ask the user to paste a redacted screenshot instead. Captures go to the scratchpad, never into a project tree.

Capture mechanics per surface: `visual-guidance.md`. Load it when about to give UI steps.

## Cross-Skill Handoffs

Recommend only; never auto-trigger external skills without user intent. Use **layered format** when handing off (short prompt block + evidence list below).

**Allowed exception:** builder one-time quiet post-delivery resume *choice* (Fast/Deep/Not now). Still never auto-run Deep without accept.

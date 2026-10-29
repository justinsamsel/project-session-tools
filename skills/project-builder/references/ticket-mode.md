# Ticket Mode

Loaded when the target folder is a ticket folder. Where this file conflicts with Step 1 (Elicit), Rules selection in Step 2, the Step 4 First Action choice, or Rules 1, 13 and 14 in SKILL.md, this file wins.

The ticket description is the whole scope. The job is to fit Claude to that one ask, not to build a durable project around the ticket's platform. Software, Infra, and Entry Points A, B and C all follow this file when the folder is a ticket folder.

## Detect

Ticket mode is on when the folder contains `TICKET.md`, or its name starts with `INC-`, `SR-`, `MI-`, `CHG-` or `PRB-` (any case), or the user says the folder is for a ticket. Otherwise ignore this file.

## Elicit (replaces Step 1)

1. Read `TICKET.md`. If it is missing, ask the user to paste the ticket text.
2. Pre-fill domain, stated environment facts, and the requested outcome from it.
3. Ask only what changes the output and the ticket does not answer. Maximum three questions, as popups, recommendation first. Typical: target environment when the ticket names none (dev or prod), or which reading of an ambiguous ask is meant.
4. Never ask Purpose ("what work repeatedly"), audience skill level, a failure-mode survey, or the conditionally required items. Default Persona is Executor and Audience is the sysadmin who runs commands; state both as `[ASSUMPTION]` only if the ticket suggests otherwise.
5. Key Context holds only facts from the ticket, the user, or files in the folder. Environment Defaults may word a question, never fill Key Context.

## Ticket Ask section (first section of CLAUDE.md, before Role)

```markdown
## Ticket Ask
Source: TICKET.md (<PREFIX-ID>)
Asked: "<verbatim lines from the ticket description that state what is wanted>"
Done when: <one testable line: the observable end state that closes the ticket>
Out of scope: Everything not stated in "Asked", including cleanups, hardening, documentation and related fixes noticed along the way.
```

- Quote the ask. Never paraphrase. Leave background in `TICKET.md`.
- If the ask has more than one reasonable reading, ask by popup before writing. Never pick one silently.
- If the ticket does not define done, propose one line and mark it `[ASSUMPTION]`.

## Scope section

In scope: the "Asked" items plus the minimum steps needed to deliver them, named. Out of scope: two to four adjacent items that are tempting for this ticket, named from context. Do not draw platform-wide boundaries.

## Scope rules (always include in the generated Rules)

1. Always do only what "Asked" states, plus the minimum steps needed to deliver it.
2. Never add features, cleanups, hardening, refactors, documentation or extra checks the ticket did not ask for, even when clearly useful.
3. Always record anything noticed outside the ask as one line labeled `Noticed, not done:` in the current dated STATUS.md entry, then continue the ask. Never act on it.
4. Always stop and ask by popup, recommendation first, before work that touches a system, object or user group the ticket does not name, or that adds a deliverable the ticket does not mention. Never proceed on a guess.
5. Always log a user-directed change to the ask as `Scope change: <what>, <date>` in STATUS.md, so the original ask stays distinguishable.
6. Always close a work turn with what was done against "Asked", whether "Done when" is met, and the `Noticed, not done` lines. No unrequested alternatives.

## Rule patterns (replaces "select relevant patterns")

Load the domain's rule-patterns file. Include a pattern only if the ticket's own change would trigger what it guards. Test: while doing the ask, would Claude do the thing this pattern protects against? Yes: include, worded for this ticket. No: omit.

- A ticket that removes stale AD accounts gets `-WhatIf` and a blast-radius statement.
- Retry and backoff, cost estimates, `prevent_destroy`, idempotency and rate limiting stay out unless the ticket's work involves them.
- A pattern guards how the ask is done. Never turn one into an extra deliverable.

Minimum rule count still applies. The six scope rules plus the working-style rule and any triggered safety rule satisfy it.

## Sections

Keep every required section from `output-format.md` (Ticket Ask first, then Role, Scope, Audience, Tone & Style, Key Context, Rules, Error Handling & Ambiguity, Knowledge Base References). Audience and Tone & Style run two to four lines each. Error Handling covers at least: ambiguous ask, ask that needs larger work than the ticket implies, and an out-of-scope request or idea. Knowledge Base References lists `TICKET.md` (the source of the ask; never edit it) plus the context files and any reference files.

## Bundle (replaces Rules 1, 13 and 14 for tickets)

Write the same files as any project: `CLAUDE.md`, and `context/PROJECT_BRIEF.md`, `STATUS.md`, `DECISIONS.md` per `starter-context-files.md`, with these ticket changes:

- **BRIEF:** Overview is the verbatim ask plus "Done when". Scope in and out come from the Scope section. Environment holds confirmed facts only.
- **STATUS:** first entry's Next Steps is the ticket's first step. Leave out "stress-test with 2-3 prompts" and "iterate on instructions".
- **DECISIONS:** as today, only decisions where alternatives were discussed.
- **Reference files:** only when the ticket has real lookup content (host lists, OU paths, a table too long for CLAUDE.md). None is the normal case. Never pad.

## First Action (replaces the selection method in Step 4)

The first concrete step toward "Done when", taken from the ticket. Not the highest-leverage area, not a task that exercises many rules. If the ask is small, the first action is the whole ask. Name the step on its own bold line, with the why on one line under it.

## Entry Point C (audit of a ticket folder)

Check for: Ticket Ask present with a verbatim quote; all six scope rules present; Key Context facts that trace to no ticket, user or folder file; rules whose pattern the ticket's work cannot trigger. Missing Ticket Ask and missing scope rules are Required. The rest are Suggested and go in the one popup. Existing project-specific content is flagged for review, never silently removed (Rule 15).

## Self-check additions

1. Every "Asked" quote appears verbatim in `TICKET.md`.
2. Every rule traces to the ask or to a safety pattern the ticket's work triggers.
3. Every Key Context fact traces to the ticket, the user, or a folder file.
4. No reference file exists without real lookup content.
5. The First Action is a step in the ticket.

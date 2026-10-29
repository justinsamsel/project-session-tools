# Audit Report Format (Entry Point C)

Loaded for Entry Point C only. Section definitions for the instructions themselves are in `output-format.md`.


Entry Point C produces an audit report before generating updated instructions. The report has two parts.

### Findings Table

Present findings as a numbered table:

| # | Section | Severity | Finding | Fix |
|---|---------|----------|---------|-----|
| 1 | Rules | Required | Rule 3 uses "try to avoid" instead of "Never..." | Rephrased to "Never..." with testable condition |
| 2 | Writing Style | Required | 14 em dashes found as sentence interrupters | Replaced with periods, commas, or semicolons |
| 3 | KB References | Required | Missing consultation triggers for 2 files | Added "when to consult" for each |
| 4 | Key Context | Suggested | Rationale paragraph mixed into facts | Moved rationale to Scope; kept facts only |
| 5 | Role | Required | Role restates STATUS current-state ("Day 11", remaining-work counts) | Removed journal facts; Role is persona only |

**Severity levels:**

- **Required:** Violates a current standard (missing section, untestable rule, em dashes, vague language, Role/Tone journal facts that belong in STATUS). Fix is included in the updated file.
- **Suggested:** Could improve but the existing approach is valid. User decides whether to apply.
- **Info:** Observation only. No change proposed (e.g., "instructions are 180 lines, under the 200-line target").

Apply Required fixes without asking. Put the Suggested items in one multiSelect popup (AskUserQuestion, or ask_user_question in Grok; at most four options per question, split if more), then generate the updated file. Exclude any Suggested item the user leaves unchecked.

### Diff Summary

After the updated file, present a concise summary of what changed:

- **Sections:** added, removed, or restructured (list each)
- **Rules:** added, modified, or removed (show before/after for modifications; state count for bulk fixes like em dashes)
- **Writing style:** count of em dash or double hyphen replacements
- **Structural:** reordering, regrouping, or reformatting changes

### Preservation Rules

Entry Point C must preserve project-specific content:

- Never remove project-specific rules that do not violate standards
- Never change domain-specific Key Context values (server names, IPs, platform versions)
- Never alter Scope boundaries without user confirmation
- Preserve rule intent even when rephrasing for compliance (e.g., "try to use WhatIf" becomes "Always use -WhatIf before destructive operations" but the intent is preserved)
- If a project-specific rule conflicts with a standard pattern, flag it in the findings table as "Info" rather than silently replacing it
- Do **not** preserve Role/Tone lines that restate STATUS current-state facts (day counts, remaining-work counts, "we are currently…"). Those are a Required finding. Strip or retarget to STATUS.

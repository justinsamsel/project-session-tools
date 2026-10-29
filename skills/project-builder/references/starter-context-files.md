# Starter Context Files

Loaded at Step 4 (Deliver) only. Section definitions for the instructions themselves are in `output-format.md`.


Generated as part of every project output bundle. Presented after reference files under the heading "Starter Context Files (Optional)." Each file is in its own fenced code block. Users who don't use the three-file continuity system can skip this section.

### Elicitation-to-Context-File Mapping

| Elicitation data | Target file | Target section |
|---|---|---|
| Suggested Project Name | PROJECT_BRIEF.md | Title (`# Project Brief: [Name]`) |
| Purpose (from elicitation) | PROJECT_BRIEF.md | Overview |
| Scope in/out | PROJECT_BRIEF.md | Scope |
| Environment answers (confirmed/overridden defaults) | PROJECT_BRIEF.md | Environment table |
| Failure modes discussed | PROJECT_BRIEF.md | Constraints |
| Audience description | PROJECT_BRIEF.md | Stakeholders |
| Persona choice (Executor/Advisor/Pair/Reviewer) | DECISIONS.md | Entry: "Project persona selection" |
| Environment overrides (chose VMware over default Hyper-V, etc.) | DECISIONS.md | Entry per override, with rationale |
| Tool/platform selections with explicit rationale | DECISIONS.md | Entry per selection |
| (none) | STATUS.md | Initial entry dated today |

### PROJECT_BRIEF.md Starter

Populate all required sections from the mapping above. Use the same section structure as `session-context-updater/references/file-templates.md`. The Environment section should include only facts specific to this project or non-obvious. Do not restate the operator's defaults that are already in the project instructions.

### STATUS.md Starter

Generate the STATUS.md starter based on the detected environment:

**Code / Cowork mode:**

```markdown
# Status: [Project Name]

## Current State

Project instructions drafted. Ready for stress-testing.

**Overall phase:** Planning

## YYYY-MM-DD: Project Setup

**Completed:**
- Drafted project instructions and reference files

**Next Steps:**
- Review PROJECT_INSTRUCTIONS.md and reference files in this directory
- Stress-test with 2–3 representative prompts
- Review and iterate on instructions based on test results
```

**Claude Projects mode:**

```markdown
# Status: [Project Name]

## Current State

Project instructions drafted. Ready for setup and stress-testing.

**Overall phase:** Planning

## YYYY-MM-DD: Project Setup

**Completed:**
- Drafted project instructions and reference files

**Next Steps:**
- Paste instructions into Claude Project Instructions field
- Upload reference files to project Knowledge Base
- Stress-test with 2–3 representative prompts
- Review and iterate on instructions based on test results
```

### DECISIONS.md Starter

Only include decisions where alternatives were explicitly discussed during elicitation. If the user confirmed all defaults without discussion, the file contains only the header and persona selection.

```markdown
# Decisions: [Project Name]

Architectural, tooling, and approach decisions made during this project.

### Project Persona Selection: YYYY-MM-DD

**Context:** Selecting the interaction model for Claude in this project.
**Decision:** [Persona]. Claude acts as [description from elicitation].
**Alternatives considered:** [Other personas mentioned or implied]
**Implications:** [How this affects output format and interaction style]
```

Add additional entries for any environment overrides or tool selections where the user chose a non-default option and provided rationale.

### Starter File Rules

- Present starter files as **optional**. Label "Starter Context Files (Optional)."
- Do not generate entries in DECISIONS.md for defaults the user simply confirmed without discussion. Accepting the default Hyper-V without comment is not a decision; it's a non-event.
- STATUS.md gets exactly one initial entry. Do not pad with speculative next steps beyond the setup checklist.
- If the user provided a thorough brief and elicitation was minimal, the starter PROJECT_BRIEF.md may be thin. That's fine. **session-context-updater** will enrich it over time.
- Include a note after the starter files: "These files bootstrap your project's continuity layer. Save them alongside your project. Use **session-context-updater** (`/session-context-updater`) at the end of future sessions to keep them current."


# Bootstrap Features

Features that activate only during bootstrap (Entry Point B): template customization and auto-trigger suggestions.

---

## Template Customization

**Purpose:** Allow projects to define custom sections, staleness thresholds, and structural preferences in their context files rather than relying solely on the default templates.

**When it activates:** During Step 1 (Detect), when reading existing context files.

### How It Works

A project can include a `<!-- session-context-config` block in any of its context files (typically PROJECT_BRIEF.md) to customize how the skill operates on that project.

### Config Block Format

```markdown
<!-- session-context-config
write_mode: auto
staleness_threshold_days: 21
custom_sections:
  PROJECT_BRIEF:
    - "## Risk Register"
    - "## Compliance Notes"
  STATUS:
    - "## Change Requests"
digest_format: ticket
-->
```

The config block uses YAML inside an HTML comment so it's invisible when the file is rendered but parseable by the skill.

### Supported Config Options

| Option | Default | Purpose |
|---|---|---|
| `write_mode` | `auto` | `auto` = extract then write without approve-before-write (default). `ask` = legacy pre-write summary + approval gate |
| `staleness_threshold_days` | 14 | Number of days before a Next Step / In Progress item is flagged as stale |
| `custom_sections` | (none) | Additional sections to include in specified files. Grouped by file key: `PROJECT_BRIEF`, `STATUS`, `DECISIONS` |
| `digest_format` | `standard` | Preferred digest format: `standard` (full digest) or `ticket` (ticket-note optimized, focuses on what was done + next steps) |
| `cross_project_registry` | (unused / deprecated) | Legacy key; ignore. Portfolio is Bases + frontmatter; do not require PROJECT_REGISTRY.md |
| `resume_behavior` | `ask` | Resume offer behavior when a primer exists (`ask` / `auto` / `never`) |
| `resume_mode` | `ask` | Preferred resume depth when offering modes |
| `resume_prompt_max_age_days` | 30 | Max age of next-session starter before it is ignored |

### Detection Rules

- Scan each existing context file for the `<!-- session-context-config` block during Step 1.
- If found, parse the YAML and apply overrides to the defaults for the remainder of the workflow.
- If not found, use all defaults. The config block is entirely optional.
- If the YAML is malformed, ignore it and use defaults. Mention in the summary: "Found a session-context-config block but couldn't parse it. Using defaults."
- Custom sections are additive. They don't replace the default required sections from `references/capture.md`. They appear after the standard sections.

### Bootstrap Integration

When bootstrapping new files (Entry Point B), after generating the default templates, offer to add a config block: "Want to customize staleness thresholds or add project-specific sections? I can add a config block to PROJECT_BRIEF.md."

---

## Auto-Trigger Suggestion

**Purpose:** Provide a ready-to-paste snippet for project instructions that reinforces automatic session-end context capture.

**When it activates:** During Step 5 (Deliver), on bootstrap (first-time file creation) AND on subsequent updates if the project instructions don't already contain session-context-updater auto-trigger language.

### The Snippet

Include this suggestion after delivering files:

> **Recommended: Add auto-trigger to your project instructions**
>
> Paste this into your project's CLAUDE.md or project instructions so context capture always happens at session end:
>
> ```
> At the end of any session where meaningful work was performed, always run the session-context-updater skill to capture context before closing. Do not perform ad-hoc manual context file updates. Use the skill instead.
> ```

### Rules

- On bootstrap (first-time creation): always offer the snippet.
- On subsequent updates: offer the snippet only if the project instructions (CLAUDE.md or Project Instructions field) do not already contain session-context-updater auto-trigger language. If they already have it, skip silently.
- Present it as recommended, not optional. Consistent context capture is the primary value of this skill.
- The snippet is a project instruction addition, not a context file addition. It goes into CLAUDE.md (for Code/Cowork) or the Project Instructions field (for Claude Projects).

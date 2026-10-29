# Cross-Project Context Awareness

**Purpose:** Detect when an extraction is relevant to a different project's context files, not just the current project.

**When it activates:** During Step 2 (Extract), after classifying extractions into the current project's files.

## How It Works

After completing extraction for the current project, scan each extracted item for cross-project relevance:

1. **Identify cross-project candidates.** An extraction is cross-project relevant when it describes an environment fact, architecture dependency, or constraint that is not scoped to the current project. Signals:
   - The item references a shared infrastructure component (e.g., a Hyper-V host, domain controller, SQL server, or network path used by multiple projects)
   - The item describes a policy or security decision that affects the broader environment
   - The item reveals a constraint that would change behavior in a different project's domain (e.g., discovering a firewall rule during a Wi-Fi project that affects a VPN project)

2. **Check for cross-project signals.** Look at frontmatter on other project context files (especially `project` and `status` properties), folder names under the projects root, or the live `projects/Projects.base`. If no strong signals, cross-project flagging remains best-effort based on conversation context. Do **not** use or require `PROJECT_REGISTRY.md`.

3. **Flag in the extraction summary.** Add a `### Cross-Project Relevance` block to the extraction summary listing each cross-project item, the target project, and why it's relevant. Present as interactive selections: "Flag for [Project Name]" / "Not relevant to other projects" / "Unsure, skip."

4. **Generate cross-project updates.** If the user approves cross-project items, generate separate update blocks for each target project's files. These are clearly labeled and delivered alongside the primary project's updates.

## Cross-Project Extraction Rules

- Never auto-apply cross-project updates. Always flag and get approval (or note under Skipped in auto write mode).
- If other projects cannot be resolved by folder/frontmatter scan, list candidates with a note: "These items may be relevant to other projects; open that project and capture there if needed."
- Cross-project items still get captured in the current project's files if they're relevant to both. Cross-project flagging is additive, not a redirect.

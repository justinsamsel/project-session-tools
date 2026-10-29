# Output Format

Every set of Project Instructions must use the following sections in the default order shown. Reorder only if a different arrangement materially improves clarity for the specific project. Sections marked **[if applicable]** may be omitted when their stated omission condition is met. Never omit them for any other reason.

Domain guidance is tagged **Software** or **Infra**. Apply the tag that matches the project's domain (chosen in Step 1) and ignore the other. Untagged text applies to both.

## Project Header (before the code block)

Before presenting files, always output a project header. Its contents differ by mode.

**In Claude Projects mode:** Present a suggested project name and description. These help the user quickly create the Claude Project without having to invent metadata on the spot.

**Suggested Project Name:** A concise 2–5 word label specific to the project's domain and task. Avoid generic names like "Coding Helper," "Infra Helper," or "IT Project." The name should be scannable in a project list alongside other projects.
- **Software** examples: "Kitchen Display App," "Gmail MCP Server," "Finance App Auth Layer."
- **Infra** examples: "Intune Win32 Packager," "Firewall Rule Reviewer," "Entra Lifecycle Automation."

**Suggested Project Description:** One to two sentences summarizing the project's purpose, primary task type, and target platform. Written as a third-person description (e.g., "Generates production-ready Intune Win32 deployment packages..." not "This project helps you..."). Should give a colleague enough context to understand the project's scope at a glance.

Format:
> **Suggested Project Name:** `<name>`
> **Suggested Project Description:** `<description>`

**In Code/vault mode:** Present a suggested project folder name. All project files (CLAUDE.md, context files, reference files) will be written under this folder in the CWD.

**Suggested Project Folder:** A lowercase-kebab-case directory name specific to the domain. Avoid generic names like `infra-helper`, `it-project`, or `coding-helper`.
- **Software** examples: `kitchen-display-app`, `gmail-mcp-server`, `finance-app-auth`.
- **Infra** examples: `intune-win32-packager`, `firewall-rule-reviewer`, `entra-lifecycle-automation`.

Format:
> **Suggested Project Folder:** `<folder-name>`

## Required Sections

**## Role**
One to three sentences. Defines what persona Claude adopts: expertise area, authority level, and relationship to the user (executor, advisor, pair, or reviewer). Persona and standing relationship only. Never put STATUS current-state facts here: day counts, remaining-work counts, sprint labels, "we are currently…", or other journal lines. Those belong in BRIEF/STATUS.
- **Software:** be specific about the domain and stack. "You are a senior full-stack engineer pairing on a Next.js 16 + Cloudflare Workers app with strict sibling conventions" not "You are a helpful coding assistant."
- **Infra:** be specific about the domain. "You are a senior endpoint management engineer acting as an executor" not "You are an IT expert."

**## Scope**
What this project covers. What is explicitly out of scope. Name specific systems, platforms, tools, and task types. Minimum two statements: one "in scope," one "out of scope."
- **Software:** draw boundaries along feature or subsystem lines (e.g., "Google Calendar read/write + AI briefing features; not user admin or billing") or along technical boundaries (e.g., "auth + session layer only"). Name frameworks as well as systems.
- **Infra:** draw boundaries along platform/domain lines (e.g., "Intune Win32 app packaging, not enrollment, compliance, or configuration profiles") rather than vague functional lines.

**## Audience**
Who Claude is talking to. Their skill level, what they already know, and what they expect.
- **Software:** specify whether the audience writes and commits code directly, whether they need deep explanations or just the deliverable + tests, what sibling project conventions must be matched, and what hardware or user constraints exist (tablet kiosk, free tier, touch-first).
- **Infra:** specify whether the audience runs commands directly, whether they need explanation or just the deliverable, and what platform knowledge Claude can assume.

**## Tone & Style**
Voice, formality level, verbosity defaults, and formatting conventions. Do not hardcode remaining-work counts, day numbers, or other STATUS current-state facts. If tone must mention progress, point at STATUS rather than a number. Specify at minimum:
- Code block language tags. **Software:** `tsx`, `ts`, `sql`, `json`. **Infra:** `powershell`, `bash`, `hcl`, `yaml`.
- Whether to provide one-liner + readable version for commands
- List style (bullets for non-ordered, numbered for sequential steps)
- Emoji conventions if used (e.g., ✅ verified, ⚠️ caution, 🚨 danger, 💡 tip)
- Whether inline code comments are expected on non-obvious parameters. **Software:** default minimal; only when WHY is non-obvious.
- **Software only:** reference style for files (path/to/file.ts:line)
- Working style (always include, adapt wording): replies are one line of state plus numbered Next steps with at most two sentences of explanation; every decision the user must make goes through the popup question tool (AskUserQuestion, or ask_user_question in Grok) with the recommendation first, never in prose; before giving steps for a UI, capture the screen and give only the next 1-3 steps
- Humor tolerance

**## Key Context**
Settled facts about the environment, stack, and constraints. Every serious project has environmental context that affects Claude's output. Include:
- **Software:**
  - Exact tech stack and versions (framework, runtime, data layer, auth, styling, deploy)
  - Hardware or form-factor targets (e.g., "Samsung Galaxy Tab A9+ landscape PWA, 1340x800, touch primary")
  - Auth and data ownership model (per-user OAuth, shared service account, D1 storage of refresh tokens)
  - Sibling project(s) whose patterns must be matched exactly
  - Constraints (free tier only, quiet hours, optimistic updates, no horizontal scroll, etc.)
  - Any app-specific behaviors or gotchas (e.g., "recurring events require explicit scope choice before delete")
- **Infra:** (if a project has no environmental context like this, the Software profile is a better fit)
  - Identity model and endpoint management platform
  - OS versions and constraints
  - Network topology facts relevant to the project scope
  - Security tooling in play
  - Any platform-specific behaviors Claude must account for (e.g., "IME runs PowerShell as SYSTEM in 32-bit host")

**## Rules**
Non-negotiable guardrails using "Always..." and "Never..." phrasing. Every rule must be testable. If there are more than eight rules, organize into labeled categories. Minimum four rules. Always include at least one rule from each category for the domain (adapt names to the project):
- **Software:**
  - **Safety / Hygiene:** secret handling, never log tokens, confirmation gates for destructive user data ops
  - **Stack & Conventions:** matching sibling projects, Server Components first, Zod validation, prepared statements
  - **Testing & Gates:** lint + typecheck + relevant tests before declaring done; local migrations first
  - **Output / Deliverable:** when to write comments, how to structure Server Actions, reference file style; always include one rule that restates the working style from Tone & Style (terse turns, decisions as popups, look at the screen before UI steps)
- **Infra:**
  - **Safety:** destructive operation guardrails, dry-run defaults, blast radius awareness
  - **Technical:** platform-specific constraints, version requirements, syntax standards
  - **Output:** formatting, documentation, and deliverable structure requirements; always include one rule that restates the working style from Tone & Style (terse turns, decisions as popups, look at the screen before UI steps)

**## Error Handling & Ambiguity**
What Claude should do when: the request is unclear, it conflicts with the Rules, the answer requires information Claude does not have, or the user asks for something out of scope. Minimum three scenarios. Always include scenarios for:
- **Software:** multiple reasonable stack approaches (ask with recommendation), secret or credential questions (flag and refuse to echo), ambiguous scope vs. sibling project patterns (check sibling first or ask), and production-affecting changes (require local verification + explicit human confirmation).
- **Infra:** unknown platform details (don't guess; ask), ambiguous environment targeting (dev vs. prod), and missing context for troubleshooting (what data to request before diagnosing).

Never include scenarios that auto-trigger context loading, file reads, or research on session open. Context synthesis (reading project files, querying external tools, producing briefings) should only be performed when the user explicitly requests it. Simple questions should get simple answers without upfront context loading.

**## Knowledge Base References**
List every reference file by filename. For each, state: what it contains, when Claude should consult it, and what Claude should not use it for. This section is always required because the skill always produces reference files alongside the main instructions. Example entry: "`site-mappings.md`: Full OU paths, street addresses, phone numbers, and samAccountName prefixes for each office. Consult when provisioning or modifying user accounts. Do not use for non-identity tasks."

## Conditionally Required Sections

**## Naming Conventions** [if applicable]
A brief summary of naming patterns in the main instructions (e.g., "Scripts follow `Verb-PFNoun.ps1`; see `naming-conventions.md` for full rules"). Detailed formulas, per-artifact-type patterns, and examples go in a reference file (`naming-conventions.md`). Omit if the project does not produce named artifacts (e.g., a troubleshooting-only or advisory project).

**## Workflow** [if applicable]
Step-by-step methodology Claude should follow for its primary task type. Include mandatory checkpoints, output format expectations, and any gates. Omit if the project's tasks do not follow a prescribed sequence with decision points or gates between steps (i.e., the project is "apply these rules to whatever the user asks" rather than "follow this procedure").

**## Examples** [if applicable]
At least one "good output" example and/or one "bad output" example, placed in a reference file (e.g., `examples.md`). The main instructions reference this file in Knowledge Base References. Label clearly as GOOD or BAD with a brief explanation of why. **Infra:** examples are high-value. A GOOD/BAD pair for a script, detection rule, config block, or troubleshooting response dramatically improves consistency. Omit only if the project's output is too varied to meaningfully exemplify.

**## Context File Integration** [if applicable]
If the project uses continuity files (PROJECT_BRIEF.md, STATUS.md, DECISIONS.md or equivalents), add them to the **Knowledge Base References** section with consultation guidance. Include entries like:
- "`PROJECT_BRIEF.md`: Current environment state, scope, constraints, and stakeholders. Consult for environment facts before making platform assumptions."
- "`STATUS.md`: Dated session log of completed work, in-progress items, blockers, and next steps. Consult to understand what has been done and what is pending."
- "`DECISIONS.md`: Key decisions with rationale and alternatives considered. Consult before re-raising questions that have already been decided."

Omit if the project does not use continuity files or if the user has not mentioned them.

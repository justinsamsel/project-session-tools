---
name: project-builder
metadata:
  version: "2026.10.28.1"
description: "Build Claude Project Instructions for software projects and for IT infrastructure projects. Software: coding projects, web and full-stack apps, CLI tools, libraries, MCP servers, Next.js/React apps, AI features inside applications, frontend and backend work, testing/CI/deploy automation, developer tools. Infrastructure: sysadmin, DevOps, endpoint management (Windows Server, AD, Entra ID, Group Policy, M365, Defender, Intune), networking (Cisco, Palo Alto, DNS, DHCP), cloud/IaC (Azure, AWS, Terraform, Ansible, Kubernetes), AI/ML operations (LLM APIs, MCP integrations, GPU provisioning), security tooling, incident response, compliance, helpdesk workflows, IoT, SCADA/OT, physical security. Also covers requests for a system prompt, custom instructions, or project setup in either domain. Picks the domain from the request and loads only that domain's rules and examples."
---

# Project Builder

Create precise, testable Claude Project Instructions for two domains: **Software** (coding projects, web and full-stack apps, tools, libraries) and **Infra** (IT infrastructure, sysadmin, DevOps, endpoint management). The Software profile produces instructions tuned for iterative code work: stack consistency, secret hygiene, testing and deploy gates, sibling project convention matching, change safety for user data and production deploys, and the assumption that the audience writes, reviews, and ships code directly. The Infra profile produces instructions tuned for enterprise infrastructure work: production safety, destructive operation guardrails, platform-specific conventions, and the assumption that the audience runs commands directly rather than delegating.

After successful delivery it recommends the single most useful concrete first action, presents the complete instructions + references + starter context, and ends with one quiet Fast/Deep/Not-now choice so the user can start aligned with the new or refreshed instructions (including after audits, and even when no next-session starter file exists yet).

## Bundled References

This skill includes reference files that are loaded on demand during specific workflow steps. Do not read them all upfront; consult each one at the step that needs it.

| File | Contents | When to consult |
|---|---|---|
| `references/shared-conventions.md` | File naming, project structure (use `context/` + `references/` for new projects); portfolio via Bases not static registry | Steps 0, 4 |
| `references/rule-patterns-code.md` | Software rule templates (safety/secret hygiene, stack conventions, testing gates, auth, AI usage in apps, deploy safety, git discipline) | Step 2, for Rules section. Software domain only |
| `references/rule-patterns-infra.md` | Infra rule templates (safety, PowerShell, networking, cloud/IaC, identity, endpoint, AI/ML operations) | Step 2, for Rules section. Infra domain only |
| `references/output-format.md` | Required/optional section definitions for output, with Software and Infra bullets tagged | Step 2, for structure |
| `references/starter-context-files.md` | Starter BRIEF/STATUS/DECISIONS templates, mapping, and rules | Step 4, Deliver |
| `references/audit-report-format.md` | Audit findings table, Diff Summary, Preservation Rules | Entry Point C only |
| `references/examples-code.md` | GOOD/BAD Software output examples at different complexity levels | Revision requests only. Software domain only |
| `references/examples-infra.md` | GOOD/BAD Infra output examples at different complexity levels | Revision requests only. Infra domain only |
| `references/vault-context.md` | In-vault detection and YAML frontmatter schema for new context files (synced from SCU) | Step 4 (Deliver) |
| `references/core-contract.md` | Shared writing style, high-signal First Action contract, quiet post-delivery offer note | Step 4, rules / output construction |
| `references/legacy-project-compat.md` | Graceful defaults + upgrade path for projects made with older skills | Entry Point C; when layout lags |
| `references/ticket-mode.md` | Ticket-folder scope lock: ticket ask pinned verbatim, scope rules, opt-in rule patterns, ticket-scoped bundle and First Action | Step 0, whenever the folder is a ticket folder |

## Core Principles

Project Instructions are system-level text injected into every conversation within a Claude Project. They shape Claude's behavior, expertise, constraints, and output format. Good project instructions share four properties:

1. **Deterministic.** Two separate Claude sessions receiving the same instructions and the same user prompt produce structurally identical output. Content varies; structure and methodology do not.
2. **Testable.** Every rule in the instructions can be verified by a reviewer. "Be thorough" is not testable. Software example: "Always require explicit recurring-series scope choice before DELETE/PATCH on recurring Google Calendar events." Infra example: "Always include `-WhatIf` before destructive Active Directory operations."
3. **Constraint-based.** Instructions tell Claude what to always do, never do, and how to handle ambiguity. They avoid vague aspirational language.
4. **Safe for the domain.**
   - **Software:** change-safe and convention-respecting. Instructions encode secret hygiene, regression prevention, local-first + confirmation gates for impactful changes, and matching patterns from sibling projects. Code work has long-term maintenance consequences that sloppy changes amplify.
   - **Infra:** production-safe. Instructions encode blast radius awareness, rollback planning, and dry-run defaults. Infrastructure work has consequences that other domains don't: a bad script can take down production.

## Content Classification

Split every output into main instructions (behavioral, ≤200 lines) and reference files (consulted on demand).

**Main instructions:** Content needed on every message (Role, Scope, Audience, Tone, Rules, Error Handling, KB References).

**Reference files:** Content needed for specific tasks (lookup tables, naming formulas, examples, decision trees, platform details).

**Classification test:** If removing it breaks *generic* messages, it's behavioral. If it only affects *specific* tasks, it's reference. Key Context stays in main instructions as summary pointers. Examples and detailed naming conventions always go to reference files.

## Domain Selection

Every run picks one domain, then loads only that domain's files. Infer it from the request, the conversation (Entry Point B), or the existing instructions (Entry Point C). Ask once through a popup only when the signals genuinely conflict or are absent (recommended option first).

| | Software | Infra |
|---|---|---|
| Signals | Primary output is code and application behavior: apps, APIs, CLI tools, libraries, MCP servers, AI features inside an app, CI/deploy for an app | Primary output is operating an environment: AD, Entra, Intune, M365, networking, firewalls, cloud/IaC, endpoint and helpdesk automation, security tooling, IoT, SCADA/OT |
| Environment Defaults | "Environment Defaults: Software" below | "Environment Defaults: Infra" below |
| Rule patterns | `references/rule-patterns-code.md` | `references/rule-patterns-infra.md` |
| Examples (revisions only) | `references/examples-code.md` | `references/examples-infra.md` |

A project that mixes both (for example, an Intune packaging tool written in TypeScript) takes the domain of its primary output; mention the other domain's concerns as Key Context rather than loading both rule files, unless the user asks for both.

## Ticket Mode

A ticket folder (contains `TICKET.md`, or named `INC-`, `SR-`, `MI-`, `CHG-` or `PRB-`) is scoped to the ticket's ask and nothing more. Load `references/ticket-mode.md` at Step 0. It replaces Step 1, rule selection in Step 2, the Step 4 First Action choice, and Rules 1, 13 and 14 for that folder. The Environment Defaults below may word a question but never fill Key Context.

## Environment Defaults

These defaults represent the primary operator's environment. Use these as starting assumptions unless the user specifies otherwise. They are defaults, not constraints. Use the table for the chosen domain only.

### Environment Defaults: Software

| Category | Default | Override signal |
|---|---|---|
| Package manager | pnpm | User mentions npm, yarn, bun |
| Language / types | TypeScript strict mode | User is on pure JS or different typing approach |
| Primary web framework | Next.js 16+ with React 19, App Router | User mentions SvelteKit, Nuxt, Remix, plain Vite, etc. |
| Runtime / hosting | Cloudflare Workers (OpenNext) or Vercel | User specifies Node server, Deno, AWS Lambda, etc. |
| Data layer | D1 + Drizzle ORM (or equivalent edge DB) | User specifies Postgres, SQLite file, Mongo, etc. |
| Auth | Better Auth + per-user Google OAuth + TOTP for writes | User specifies different provider or session model |
| Styling | Tailwind v4 | User specifies CSS modules, vanilla, etc. |
| Testing | Vitest (unit) + Playwright (e2e) | User specifies Jest, Cypress, etc. |
| AI inside app | Workers AI or Claude Haiku (cheapest viable for user scale) | User specifies different model/provider or no AI |
| Deploy tooling | wrangler / pnpm run deploy (with token hygiene) | User specifies other CI or deploy commands |
| VCS discipline | git; explicit confirmation for destructive or remote-affecting ops | User has specific commit/PR conventions |
| Documentation | Markdown + references/ and context/ | User specifies different layout or formats |

### Environment Defaults: Infra

| Category | Default | Override signal |
|---|---|---|
| Identity | Entra ID (cloud-native, Entra Connect Sync with PHS) | User mentions on-prem AD, hybrid join, or ADFS |
| Endpoint management | Microsoft Intune / Autopilot | User mentions SCCM, MECM, Jamf, or Workspace ONE |
| Virtualization | Hyper-V | User mentions VMware, Proxmox, or KVM |
| Cloud | Azure primary, AWS secondary | User mentions GCP or single-cloud context |
| Email/collaboration | Microsoft 365 | User mentions Google Workspace or other |
| Security tooling | Defender + [EDR platform] + [email security] | User mentions CrowdStrike, SentinelOne, Proofpoint, etc. |
| Ticketing | Freshservice | User mentions ServiceNow, Jira Service Management, etc. |
| PowerShell | 7+ syntax by default | User specifies 5.1 constraint (e.g., Intune IME scripts) |
| IaC | Terraform 1.10+, Ansible | User mentions Pulumi, CloudFormation, etc. |
| Documentation | Markdown for internal, .docx for management-facing | User specifies other formats |
| Scripting style | One-liner + readable version for commands; fenced code blocks with language tags | User specifies different preferences |

## Environment Detection

| Signal | Environment | Delivery |
|---|---|---|
| CWD starts with `/sessions/` | **Cowork VM** | Warn about limited features, then deliver like Code mode |
| CWD is a real filesystem path | **Code** | Write `CLAUDE.md` at project root (main instructions); write starter context files to `context/` and reference files to `references/` |
| No writable CWD | **Claude Projects** | Fenced code blocks with copy-paste/upload instructions |

If Write and Bash tools are available with a real CWD, this is Code mode (even if empty). CWD is the project directory; never write outside the CWD tree.

## Workflow

Determine which entry point applies, then follow the corresponding sequence.

### Entry Point A: Fresh Start

The user has asked to create Project Instructions for a new software or infrastructure project with no prior conversation context. Follow Steps 1 through 4 in order.

**References to load:** Load `output-format.md` + the domain's rule-patterns file (`rule-patterns-code.md` or `rule-patterns-infra.md`) during Step 2 (Draft). Load `vault-context.md` during Step 0 (Detect) and Step 4 (Deliver) for vault-aware bootstrap. Load `starter-context-files.md` during Step 4 (Deliver). Do NOT load the examples file on first draft. Only load the domain's examples file (`examples-code.md` or `examples-infra.md`) if the user requests revisions.

### Entry Point B: Mid-Conversation Pivot

The user wants to turn the current conversation (or a described past workflow) into a Claude Project. This is detected by phrases like "turn this into a project," "I want to reuse this," or "make this a project."

**References to load:** Load `output-format.md` during inference summary. Load the domain's rule-patterns file during Step 2 (Draft). Load `vault-context.md` during Step 4 (Deliver) for vault-aware bootstrap. Load `starter-context-files.md` during Step 4 (Deliver). Do NOT load the examples file on first draft. Only on revision (the domain's `examples-code.md` or `examples-infra.md`).

1. **Extract.** Review the full conversation. Identify the domain (Software or Infra, per Domain Selection), then: the domain and purpose, tools and platforms (Software: framework, runtime, data, auth, deploy; Infra: identity, endpoint, network, cloud, scripting), commands and scripts written, output format patterns, safety / convention / hygiene practices observed, constraints the user stated or implied, and any corrections the user made (corrections reveal important rules, especially around safety, production practices, secrets, testing gates, and consistency). Do **not** copy STATUS Current State into Role or Tone (no day counts, remaining-work counts, "we are currently…").
2. **Summarize inferences.** Present a concise, structured summary of what you extracted, organized by the Output Format sections (see `references/output-format.md`). Use bullet points, not prose. One bullet per inferred fact. Be explicit about what you inferred vs. what was directly stated. Flag anything uncertain. Note where inferred values match or differ from the Environment Defaults.
3. **Confirm.** Ask the user to verify your inferences and fill any gaps. Focus questions only on what you could not confidently extract.
4. **Continue to Step 2** (Draft) using confirmed context.

### Entry Point C: Audit and Refresh

The user wants to update existing project instructions to match current conventions without full re-elicitation. Detected by phrases like "audit these instructions", "refresh this project", "update instructions", "bring this up to date", "check my instructions," "upgrade project for current skills," "modernize this project."

**References to load:** `output-format.md` + `audit-report-format.md` + the domain's rule-patterns file + `vault-context.md` (audit must resolve vault-tier PROJECT_INSTRUCTIONS.md when present). Load `legacy-project-compat.md` when context layout looks pre-modern (no trio, no frontmatter in vault, no config, registry-era). Load the domain's examples file only if quality recalibration is needed during revision.

**Workflow:**

1. **Load.** Read existing PROJECT_INSTRUCTIONS.md or `CLAUDE.md` from `context/` or project root (detect by content, not filename). Infer the domain from its content (per Domain Selection) before loading the rule-patterns file. Also read context files if available (PROJECT_BRIEF.md, DECISIONS.md) for environment and scope data. Apply graceful defaults from `legacy-project-compat.md` if the project is old; never refuse because continuity files are incomplete.
1b. **Compat (quiet).** If lag is material, use graceful defaults and finish the instruction audit. Do not recommend session-context-updater Entry Point H unless the user asked to upgrade context.

2. **Audit.** Compare existing instructions against current standards. Check each item:
   - All required sections present per `output-format.md` (Role, Scope, Audience, Tone & Style, Key Context, Rules, Error Handling & Ambiguity, KB References)
   - Optional sections present only if relevant (Naming Conventions, Workflow, Examples)
   - Rules use "Always..."/"Never..." phrasing and are testable
   - Rules organized by category if more than 8 rules
   - At least one Safety rule if project touches production systems (Infra) or user data / secrets / deploys (Software)
   - No em dashes (U+2014) or double hyphens as sentence interrupters
   - No vague or aspirational language ("be thorough", "use best practices" without concrete definition)
   - Key Context contains only output-changing facts (no rationale, no background)
   - KB References lists all reference files with consultation triggers
   - Every section has at least 2 actionable statements
   - Main instructions under 200 lines of behavioral content
   - Rule numbering is contiguous (no gaps, no duplicates)
   - No duplicate rules (same intent expressed twice)
   - Role and Tone contain no STATUS current-state facts (day counts, remaining-work counts, sprint labels, "we are currently…"). See `output-format.md`. Those lines are a Required finding; strip or retarget to STATUS. They are not preserved project-specific content.

3. **Present findings.** Show a numbered findings table with severity and proposed fix for each item. See `audit-report-format.md` for the table structure. Required fixes apply without asking. Put the Suggested items in one multiSelect popup (AskUserQuestion; Grok: `ask_user_question`, at most four options per question, split if more) and generate the updated file once the user answers. No "approve?" prose.

4. **Generate.** Produce updated instructions preserving all existing project-specific content (rules, Key Context, Scope) except where fixes apply. Run Self-Check (Step 3) on the updated version.

5. **Deliver.** Present the updated file with a short diff summary (sections added/removed, rules changed, writing style fixes). Follow the same delivery rules as Step 4 (Code mode writes to disk, Claude Projects mode outputs code blocks), **including the quiet post-delivery resume choice** (same as Step 4). The choice must appear after audits/refreshes the same way it does after fresh deliveries.

---

### Step 0: Detect Existing Context (Optional)

Before elicitation, check the working directory for `TICKET.md` or a ticket-prefixed folder name. If present, read `TICKET.md` and load `references/ticket-mode.md`; its Elicit section replaces Step 1.

Then check the working directory and project knowledge base for existing continuity files (PROJECT_BRIEF.md, STATUS.md, DECISIONS.md, or equivalents; classify by content, not filename). If found:

1. Read the Brief/Inventory file for Environment, Scope, Constraints, and Stakeholders sections.
2. Read the Decisions file for tool/architecture choices already made.
3. Pre-populate Step 1 elicitation answers from these files. Present them as confirmable defaults: "I found your PROJECT_BRIEF.md. Based on it, I'm assuming: [list]. Confirm or correct?"
4. Skip questions that the context files fully answer. Focus elicitation on gaps only.

If no context files are found, proceed directly to Step 1.

### Step 1: Elicit

Ticket folder: skip this step and use the Elicit section of `references/ticket-mode.md`.

Gather the information needed to draft. Do not ask questions the user has already answered. Acknowledge what you have, identify gaps, and ask only about gaps.

**Required information** (you need answers to all of these before drafting):

- **Domain:** Software or Infra (see Domain Selection). Infer it; ask once by popup only if unclear. Every domain-specific item below follows the chosen domain.
- **Purpose:** What work will Claude repeatedly help with?
  - **Software:** e.g., "implement calendar features and AI briefings for the kitchen display app", "build and maintain an MCP server for Gmail", "add auth + testing to this Next.js tool"
  - **Infra:** e.g., "build Intune deployment packages," "review firewall rules," "automate AD user provisioning"
- **Persona:** What expertise and relationship should Claude adopt? Common choices are:
  - **Executor:** writes production-ready scripts and configs the user deploys directly
  - **Advisor:** analyzes, recommends, and explains but the user writes the final implementation
  - **Pair:** works alongside the user, proposing and iterating collaboratively
  - **Reviewer:** audits configs, scripts, or architectures the user provides
- **Audience:** Who is Claude talking to? Skill level and expectations. Key signals:
  - **Software:** does the audience write and commit code directly? Do they need deep explanations or just the implementation + tests? Are there sibling projects whose conventions must be matched?
  - **Infra:** does the audience run commands directly or delegate? Do they need explanations or just the deliverable?
- **Environment:** What platforms, tools, and versions are involved? Start from the Environment Defaults table for the domain and confirm or override. Key questions:
  - **Software:**
    - Primary framework and runtime?
    - Data / DB layer and migration strategy?
    - Auth model and sensitive data handling?
    - Deploy target and command conventions?
    - Sibling projects or monorepo patterns to match?
  - **Infra:**
    - Identity model (Entra-only, hybrid, on-prem AD)?
    - Endpoint management platform?
    - Cloud provider(s)?
    - Primary scripting language and version constraints?
    - Any security tooling Claude needs to be aware of?
- **Failure modes:** What mistakes would be costly? Always cover:
  - **Software:**
    - Secret / credential leakage into code, logs, or git
    - Breaking production deploys or user data
    - Regressions for end users (especially on constrained devices like tablets)
    - Drift from established patterns in sibling projects
    - Skipping tests or local-first validation gates
  - **Infra:**
    - Production safety (destructive operations, blast radius)
    - Credential/secret handling
    - Change management and rollback requirements
    - Platform-specific gotchas (e.g., 32-bit PowerShell in Intune, registry hive ambiguity)

**Conditionally required** (ask only if signals present):

- **Conventions:** Naming patterns, commit conventions, doc formats. Ask if the user mentions a team or existing standards.
- **Boundaries:** Out-of-scope items, environment restrictions (dev/staging/prod), cost-impact flagging. Ask if scope is broad.
- **Knowledge base:** Reference docs, schemas, runbooks. Ask if the user mentions reference material.

**Elicitation rules:** Use interactive selections for bounded choices (pre-populated from Environment Defaults). Reserve prose for free-form topics only. Group naturally, max 5 questions per message, max 2 rounds. If the user provides thorough context upfront, skip to Step 2. Flag remaining gaps as `[ASSUMPTION]`.

### Step 2: Draft

Produce a complete project output bundle: one main instructions file plus one or more reference files.

Before drafting, read the reference files specified by your entry point. If your entry point's reference spec includes `output-format.md`, read it for the required section structure. If it includes the domain's examples file (`examples-code.md` or `examples-infra.md`), read it to calibrate output quality and proportionality. If it includes the domain's rule-patterns file (`rule-patterns-code.md` or `rule-patterns-infra.md`), read it when generating Rules and select relevant patterns. Never load the other domain's files. Adapt phrasing to the specific project, do not copy blindly.


**Generate starter context files.** After drafting the main instructions and reference files, generate starter context files (PROJECT_BRIEF.md, STATUS.md, DECISIONS.md) populated from elicitation data. See `references/starter-context-files.md` for the mapping and format. These files are presented as optional; users who don't use the three-file continuity system can skip them.

**Drafting rules:**

- **Ticket folder:** open CLAUDE.md with the Ticket Ask section, include the six scope rules, and select rule patterns only when the ticket's own change triggers them (all per `references/ticket-mode.md`).
- **In Claude Projects mode:** Always suggest a project name and description before the instructions code block. Present these as a short heading block the user can copy directly into the Claude Project setup fields. The name should be concise (2–5 words), specific to the domain (Software: "Kitchen Display App," "Gmail MCP Server," "Finance App Auth Layer"; Infra: "Intune Win32 Packager," "Firewall Rule Reviewer," "AD User Provisioning"), and avoid overly generic labels like "Coding Helper" or "Infrastructure Helper." The description should be one to two sentences summarizing the project's purpose and primary task type, written as if it will appear in a project list alongside other projects. Format as:
  > **Suggested Project Name:** `<name>`
  > **Suggested Project Description:** `<description>`
- **In Code/vault mode:** Suggest a project folder name before presenting files. Format as:
  > **Suggested Project Folder:** `<folder-name>`
  Folder name should be lowercase-kebab-case and specific to the domain (Software: `kitchen-display-app`, `gmail-mcp-server`, `finance-app-auth`; Infra: `intune-win32-packager`, `firewall-rule-reviewer`). All project files will be written under this folder in the CWD.
- **Always split the output** into main instructions + reference files per the Content Classification rules. The main instructions file targets ≤200 lines. If the instructions exceed 200 lines, audit for content that should be in reference files.
- **In Claude Projects mode:** Output the main instructions inside a single fenced code block (plain text) so the user can copy-paste directly into a Claude Project.
- **In Code/vault mode:** Write the main instructions as `CLAUDE.md` at the project root using the Write tool. Do not wrap in a fenced code block. Claude Code reads this file automatically on session open.
- Output each reference file in its own fenced code block, clearly labeled with the filename (e.g., `site-mappings.md`, `naming-conventions.md`, `examples.md`).
- The main instructions must include a **Knowledge Base References** section that lists every reference file by name, describes what it contains, and states when Claude should consult it.
- Every instruction must be specific enough that a reviewer could check whether Claude followed it.
- Length of the main instructions must be proportional to the project's complexity. A narrow-scope project may need 30 lines. A complex one may need 150-200. Do not pad. Do not over-engineer simple projects.
- If the user provided example outputs or described conventions, encode the behavioral patterns as explicit rules in the instructions, and place the detailed examples in a reference file.
- **Software:** always include at least one safety / change-safety rule unless the project is purely local/experimental. At minimum, address: never committing secrets, local-first + confirmation for impactful DB or deploy changes, and TOTP or equivalent re-verification for destructive user-facing operations when applicable.
- **Infra:** always include production safety rules unless the project is explicitly limited to non-production environments. At minimum, address: dry-run/`-WhatIf` defaults for destructive operations, blast radius awareness, rollback steps for irreversible changes, and credential handling.

**Reference file naming:**
- Use lowercase kebab-case: `site-mappings.md`, `naming-conventions.md`, `examples.md`, `department-list.md`, `decision-tree.md`
- Name files by content type, not by project name. This keeps them scannable in the project knowledge base

### Step 3: Self-Check

Revise silently if any fails:

1. All required Output Format sections present; optional sections only if relevant; every section has ≥2 actionable statements
2. No underspecification; every rule uses "Always..."/"Never..." and is testable; no rule contradictions
3. Every referenced document includes filename and purpose; KB References lists all files
4. Instructions work on first message with zero context; fallbacks for missing context; edge cases defined
5. Relevant safety rule exists. Software: secret hygiene / change-safety if the project touches secrets, user data, or production deploys; stack details verified or flagged. Infra: production safety rule if the project touches production; platform details verified or flagged
6. Main instructions ≤200 lines behavioral content only; Project Name + Description present (Claude Projects mode) or Project Folder present (Code/vault mode)
7. No duplicate rules; Key Context = output-changing facts only
8. Entry Point C: audit findings reflect actual drift; project-specific content preserved except Role/Tone STATUS current-state facts (Required; strip)

### Step 4: Present and Iterate

Present the complete output bundle: suggested project name and description first, then main instructions file, then each reference file. For each reference file, briefly state what it contains and confirm the filename.

**Code/Cowork mode:** Write `CLAUDE.md` at the project root (this is the file Claude Code reads automatically on session open). Also write starter context files to `context/` and reference files to `references/` under the project folder. **In-vault mode:** if CWD is inside an Obsidian vault (check per `references/vault-context.md`), starter context files receive YAML frontmatter (type, project, status, last-updated, owner, related-systems). Reference files always remain plain markdown. Outside the vault (legacy archive), context files stay plain. Present all written file paths. Do not provide copy-paste instructions.

**Claude Projects mode:** Output each file in labeled fenced code blocks. Provide setup instructions (create project, paste instructions, upload reference files to KB).

**Recommended First Action (the single most useful starting point)**

After the complete output bundle has been presented or written, lead with one high-signal recommendation for the *single most useful concrete thing* the user can do with these new instructions right now. This becomes the very first machine/human interaction and the launchpad for an excellent session.

**Ticket folder:** the first action is the first concrete step of the ticket, per `references/ticket-mode.md`. Skip the selection method below.

**How to choose the single best first action:**
- Primary signal: the elicited **Purpose** (what they will repeatedly use this project for).
- Strong secondary signal: the top **Failure modes** the user explicitly described (address real pain).
- Factor in **Persona**: Executor → a real "do real work" task; Reviewer/Advisor → a review or analysis task on existing material.
- Make it *specific* using details from the conversation (app names, APIs, routes, tickets, environments mentioned).
- Prefer something that exercises multiple of the new rules (especially safety/secret hygiene + stack conventions) in a single interaction.
- It must be immediately actionable and give fast, useful feedback on whether the instructions are working well for them.
- Keep it proportional to project scope — narrow projects get a focused real task; broad projects get the highest-leverage sub-area from the Purpose.

Present it in this order and style (adapt language naturally, do not make it feel like a rigid template):

**Recommended First Action**

The single most useful thing we can do right now with these instructions is: **[clear, specific description of the task]**.

**Why this is the best starting point:** [1–2 sentences tying directly back to the Purpose + the key failure mode or constraint we discussed].

[Direct, low-friction invitation to begin.]

**Starter context (Code mode):** If starter context files were written with the bundle, list their paths once with the delivery summary. Do not add a second lecture after the First Action. One short note is enough: use **session-context-updater** to keep them current later.

**Portfolio:** Do **not** create or update `PROJECT_REGISTRY.md` (deprecated; portfolio is `projects/Projects.base` + BRIEF frontmatter). No registry offer in the delivery response.

**Quiet resume choice (required after successful delivery):** After the Recommended First Action — for both fresh deliveries (Step 4) and audits/refreshes (Entry Point C Deliver) — present **one** AskUserQuestion unless `resume_behavior: never` is set in a `<!-- session-context-config` block.

Agent-internal only: check `context/prompts/next-session/latest.md` (and age vs the latest STATUS entry when possible). Primer state must **not** be narrated to the user. Fast/Deep always mean "use a current next-session starter"; if missing or stale, generate it as part of accept.

Canonical question (keep this short):

> Want a clean start with these updated instructions?

Options (always these three; one-time per delivery; low pressure):
1. **Fast** — load context and go
2. **Deep** — short priority check first
3. **Not now**

On accept:
- **If no usable starter:** Load session-context-updater's `references/next-session-prompt.md` guidance (or equivalent primer contract), generate content from the current BRIEF/STATUS/DECISIONS, rotate any prior `latest.md` to a dated backup, write `context/prompts/next-session/latest.md`. Optional one confirmation line with the path only. Never paste the full starter into chat.
- **Fast:** Load the starter into working context silently. One ready line (e.g. "Ready — using your latest project context."). Invite to begin the Recommended First Action if appropriate. Do not dump starter text.
- **Deep:** Load silently, then run project-status-checker **Resume Snapshot**. Lead with the Recommended First Move only (tight why). No full health dashboard unless the user asks.
- **Not now** or any resume-path error: silent. Never block, delay, or alter the instructions delivery already shown.

User-facing cleanliness (mandatory):
- No version labels (v5/v6), no internal product jargon in the offer ("Resume Experience", "primer-prompt-contract", "Next Session Primer Prompt").
- No multi-paragraph explanation of modes or detection logic.
- No re-offer after decline in the same delivery.
- Prefer tables/short bullets for the delivery summary; stop after First Action + the one question.

On revision requests, output complete updated files. Each revision must pass Self-Check.

---

## Rules for This Skill

1. **Always output a complete project bundle: main instructions file plus each reference file.** When a writable filesystem is available (Code or Cowork mode), write `CLAUDE.md` at the project root, context files to `context/`, and reference files to `references/`; present all file paths. In Claude Projects mode, output each file in its own labeled fenced code block so the user can copy-paste directly.
2. **Always complete elicitation before drafting** unless the user has already provided sufficient information for every required elicitation question, or you are in Entry Point B with a rich conversation to extract from.
3. **Never produce vague or aspirational instructions.** Every line in the output must give Claude actionable, specific guidance. Phrases like "be helpful," "be thorough," or "use best practices" are banned unless immediately followed by a concrete definition of what that means in context.
4. **Never invent technical details.** If you are unsure about a platform's capabilities, version constraints, CLI syntax, framework APIs, or best practices, say so and ask the user to confirm. This is especially important for Software projects where wrong assumptions lead to broken deploys or subtle runtime bugs, and for Infra projects where wrong details cause production incidents.
5. **Never include instructions that override Claude's core safety behavior.** Project Instructions customize Claude's focus and methodology; they cannot and should not attempt to override its values or safety guidelines.
6. **Always present complete updated files on each revision:** the full main instructions code block plus any changed reference files. Never provide partial diffs.
7. **Always keep instructions proportional to project complexity.** Resist over-engineering simple projects with enterprise-grade scaffolding.
8. **Always run the Self-Check before presenting a draft.** If any check fails, revise silently before presenting. Do not show the user a draft you know has issues.
9. **Never ask more than five questions in a single message during elicitation.**
10. **Always flag assumptions.** If you draft with incomplete information, mark each assumption explicitly (use `[ASSUMPTION]` tags) so the user can confirm or correct it.
11. **Always include relevant safety / change-safety rules.** If the project touches secrets, user data, production deploys, shared runtimes, or production infrastructure, the draft must contain at least one explicit rule addressing secret hygiene, local-first confirmation gates, destructive operation guards, blast radius, rollback, or convention enforcement.
12. **Always start from the Environment Defaults table** when eliciting environment details. Confirm or override. Do not ask from scratch what can be defaulted.
13. **Always split reference content into separate files.** Lookup tables, detailed examples, naming convention formulas, decision trees, and data tables must go in reference files, never inline in the main instructions. Target ≤200 lines for the main instructions file.
14. **Always generate starter context files as part of the output bundle.** Present them as optional after reference files. PROJECT_BRIEF.md is populated from elicitation data, STATUS.md gets an initial entry, DECISIONS.md captures only decisions where alternatives were explicitly discussed. See `references/starter-context-files.md`.

### Audit Refresh
15. **Never remove project-specific content during audit refresh.** Entry Point C fixes standards compliance and fills gaps. It does not redesign the project. Existing rules, Key Context, Scope, and domain-specific conventions that do not violate current standards must be preserved verbatim. Exception: Role/Tone lines that restate STATUS current-state facts (day counts, remaining-work counts, "we are currently…") are a Required standards finding. Strip or retarget them; do not preserve them. If a project-specific rule conflicts with a standard rule pattern, flag it for user review rather than silently replacing it.
16. **Legacy projects are first-class.** Incomplete continuity layouts must not block audit/refresh. Prefer `legacy-project-compat.md` graceful defaults. Do not offer context upgrade (SCU H) unless the user asked to upgrade.

### Quiet post-delivery resume choice
17. **Always present the quiet resume choice after any successful delivery (fresh or audit/refresh).** After the Recommended First Action (Step 4 for fresh deliveries; after Deliver for Entry Point C), use one AskUserQuestion with Fast / Deep / Not now unless `resume_behavior: never`. The choice is *not* gated on a pre-existing next-session starter. Primer detection stays agent-internal. Do not require a separate session-context-updater trip before the offer.

18. **Handoff quietly on acceptance; generate starter when missing; never block delivery; never dump starter text.** On Fast/Deep accept: if no usable `context/prompts/next-session/latest.md`, generate and write it (with rotation), then load it silently. Fast: one ready line. Deep: Resume Snapshot → Recommended First Move only. Decline and errors are silent and must not alter delivered instructions. Applies equally to Step 4 and Entry Point C.

### Post-Delivery Launch Experience
19. **Always lead the post-delivery response with one single recommended first action.** After presenting the output bundle, the very first substantive guidance must be the single most useful concrete next step the user can take with the new instructions. Do not lead with a generic list or the resume choice.

20. **Choose the single best first action intelligently and specifically.** Base the choice on the elicited Purpose + the most important Failure modes the user described. Factor in Persona (Executor = real production task; Reviewer = review/audit task). Make the recommendation *specific* using real details from the session. Present it compellingly with a clear "why this first" and a direct invitation to begin.

21. **No alternatives in prose.** The Recommended First Action is the star. Do not list other options; the Fast / Deep / Not now popup is the only question after delivery. If the user asks for other options, give them as a popup, not bullets.

22. **Keep the delivery surface clean.** User-facing post-delivery text must not include version labels, internal product names for the offer, primer-state narration, full starter paste, registry create/update, or a re-offer after decline. Delivery summary + First Action + one question is the default shape.

### Ticket Folders
23. **Never go past the ticket.** In a ticket folder the generated instructions must scope Claude to the ticket's ask as quoted from `TICKET.md`, and must not add work, deliverables, rules or Key Context the ticket, the user or the folder did not supply. Follow `references/ticket-mode.md`.

### Writing Style, Output Contract, and Cross-Skill Handoffs
See `references/core-contract.md` for the shared writing style rule, high-signal output contract (Recommended First Action lead behavior, tables + short bullets by default, stop after the star), and minimal cross-skill handoff principle.

The Recommended First Action structure and language in this skill follows the contract.

---

## Cross-Skill Handoffs

Recommend only for external handoffs (layered format: short prompt block + evidence). Exception: the **quiet post-delivery resume choice** in this skill is a first-class, one-time offer after delivery (never auto-run Deep without accept).

### session-context-updater

| Condition                              | Recommendation |
|----------------------------------------|----------------|
| Just delivered or refreshed instructions (Code or Claude Projects mode), including after Entry Point C audits and refreshes | Present the quiet Fast / Deep / Not now choice. If no usable next-session starter exists, generate it on Fast/Deep accept (no separate manual trip required). Keep user-facing text short. |
| User wants to align a new or updated project with current priorities | Recommend running session-context-updater for capture; the quiet resume choice may also appear after that skill's own delivery. |

### project-status-checker

| Condition | Recommendation |
|-----------|----------------|
| User accepted **Deep** on the post-delivery resume choice | Run Resume Snapshot from this conversation (or via session-context-updater Deep path). Present Recommended First Move only; no full dashboard unless asked. |

# Infrastructure Rule Patterns

When drafting Rules for infra projects, draw from these domain-specific patterns as relevant. Do not include patterns that are irrelevant to the project scope. Adapt phrasing to the specific project. These are templates, not copy-paste rules.

Each pattern includes a brief rationale. When adapting a pattern into project instructions, carry the reasoning forward. Claude follows rules more reliably when it understands the consequence of breaking them.

## Safety Patterns

- **Always offer a dry-run or `-WhatIf` version before any command that modifies, deletes, or disables production resources.** *Why: unscoped filters can wipe hundreds of objects in seconds; dry-run is the only pre-execution gate.*

- **Always state the blast radius before proposing changes that affect multiple objects (users, devices, policies, firewall rules).** *Why: operators need to mentally model scope of impact before approving. "This GPO affects 3 OUs containing 412 computer objects" is actionable; "this affects the linked OUs" is not.*

- **Always include rollback steps for any change that is not trivially reversible.** *Why: some operations (OU subtree deletion, mailbox hard-delete, Terraform destroy of stateful resources) are irreversible or require backup restoration.*

- **Never generate commands targeting production resources without explicit environment confirmation from the user.** *Why: a script written against dev that gets pasted into a prod terminal is the most common class of infrastructure incident.*

- **Never store or echo credentials, API keys, tokens, or secrets in scripts, logs, or output.** *Why: secrets in plaintext end up in version control, ticket systems, and chat logs. Use `Get-Credential`, environment variables, or vault references.*

## PowerShell Patterns

- **Always default to PowerShell 7+ syntax unless the execution context requires 5.1 (e.g., Intune IME, older Server Core).** *Why: 7+ offers ternary operators, null-coalescing, parallel ForEach-Object, and improved error handling. Intune's IME runs 32-bit 5.1, so 7+ syntax silently fails there.*

- **Always include `$ErrorActionPreference = 'Stop'` and `try/catch` with explicit exit codes in deployment scripts.** *Why: without `'Stop'`, non-terminating errors are logged but execution continues. Failed steps are silently skipped and subsequent steps run against inconsistent state.*

- **Always use `Start-Process -Wait` when launching installers. Never allow asynchronous execution in deployment scripts.** *Why: without `-Wait`, the script reports success while the installer is still running. Detection scripts or reboots firing mid-install corrupt the deployment.*

- **Never use `Write-Host` in scripts that may run non-interactively.** *Why: `Write-Host` writes to the console host process with no capturable pipeline output. Scripts under SYSTEM, in Intune IME, or CI/CD have no host, so output is silently discarded. Use `Write-Output`, `Write-Verbose`, or a custom `Write-Log`.*

## Networking Patterns

- **Always specify the exact firewall context (global vs. vsys, zone pair, policy set) when generating or reviewing rules.** *Why: a rule written for the wrong vsys or zone pair either does nothing or opens unintended traffic paths.*

- **Never propose firewall rule changes without stating the traffic flow direction and expected hit count impact.** *Why: rules are ordered and directional. Wrong placement shadows existing rules or never matches.*

- **Always verify whether NAT is in play before troubleshooting connectivity issues.** *Why: troubleshooting with pre-NAT addresses when rules evaluate post-NAT (or vice versa) wastes hours chasing phantom mismatches.*

## Cloud / IaC Patterns

- **Always write Terraform configurations that are idempotent and safe to re-apply.** *Why: non-idempotent configurations (inline provisioners, create-only resources without lifecycle rules) break Terraform's declarative convergence contract and cause drift.*

- **Always include `prevent_destroy` lifecycle rules on stateful resources (databases, storage accounts, key vaults).** *Why: a mistyped `terraform destroy` or refactor that removes a resource block permanently deletes stateful data. `prevent_destroy` forces explicit override.*

- **Never hardcode region, subscription, or account identifiers. Use variables or data sources.** *Why: hardcoded identifiers make configs non-portable and create silent failures when applied to the wrong environment.*

- **Always run `terraform plan` output review as a gate before `terraform apply` recommendations.** *Why: plan output is the only pre-execution diff showing exactly what will be created, modified, or destroyed.*

## Identity / Directory Patterns

- **Always specify whether an operation targets Entra ID, on-prem AD, or both when the environment is hybrid.** *Why: changes made in the wrong directory fail to sync, create conflicts, or get overwritten on the next sync cycle.*

- **Never modify group memberships or OU structure without confirming the scope of impact (how many objects affected, downstream policy inheritance).** *Why: group memberships drive licensing, conditional access, app assignments, and GPO filtering. A single change can alter access for hundreds of users.*

- **Always verify sync cycle timing when troubleshooting Entra Connect issues. Changes may take 30+ minutes to propagate.** *Why: Entra Connect's default sync interval is 30 minutes. Troubleshooting a "missing" change that hasn't synced yet leads to unnecessary remediation.*

## Endpoint Management Patterns

- **Always specify install context (SYSTEM vs. user) for Intune deployments. Default to SYSTEM unless explicitly told otherwise.** *Why: most Win32 apps require SYSTEM for MSI installation, HKLM registry writes, and Program Files access. User context fails silently on operations needing elevation.*

- **Always use the stdout detection convention for Intune detection scripts. Never use `return $true/$false`.** *Why: the IME evaluates detection by checking for stdout output, not PowerShell return values. `return $true` produces no stdout → "not detected" → infinite reinstall loops.*

- **Never assume endpoint internet connectivity during deployment.** *Why: Autopilot and Intune deployments stall if packages reference external URLs unreachable due to network policy or proxy. Flag every external dependency and recommend bundling.*

## AI/ML Operations Patterns

- **Always specify which model, API version, and endpoint when generating LLM integration code.** *Why: AI APIs version aggressively. A script against a specific model may hit a deprecated endpoint within months. Pinning makes failures explicit.*

- **Always include rate limiting, retry logic with exponential backoff, and error handling for API calls to external AI services.** *Why: without retry logic, a single 429 fails the entire workflow. Exponential backoff prevents retry storms that worsen throttling.*

- **Never embed API keys directly in code. Use environment variables, secrets managers, or credential stores.** *Why: API keys in source code end up in git history, CI/CD logs, and chat pastes. A leaked key grants full API access at the key's permission level.*

- **Always include token/cost estimation when proposing workflows that involve high-volume API calls.** *Why: a workflow processing 10,000 documents at $0.015/1K input tokens silently generates $150+ per run. Stating cost upfront enables informed go/no-go decisions.*

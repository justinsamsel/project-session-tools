# General Coding / Tech Project Rule Patterns

When drafting Rules for coding and application projects, draw from these domain-specific patterns as relevant. Do not include patterns that are irrelevant to the project scope. Adapt phrasing to the specific project. These are templates, not copy-paste rules.

Each pattern includes a brief rationale. When adapting a pattern into project instructions, carry the reasoning forward. Claude follows rules more reliably when it understands the consequence of breaking them.

## Safety & Secret Hygiene Patterns

- **Never write secrets (API keys, client secrets, tokens, TOTP seeds, DB credentials) into committed files, logs, or chat output.** *Why: secrets in git history or logs are the most common source of breaches; use wrangler secrets, .dev.vars, or environment injection.*

- **Always require explicit human confirmation before any destructive or production-affecting change (remote D1 migrations, prod deploys that touch user data, bulk deletes).** *Why: "just do it" leads to accidental data loss or expensive operations; local-first + confirmation is the reliable gate.*

- **Never log OAuth refresh tokens, access tokens, or TOTP secrets (full or partial beyond last 4 chars in controlled debug scenarios).** *Why: logs end up in error reports, CI artifacts, and shared terminals.*

- **Always re-verify sensitive operations (writes, deletes, auth changes) with TOTP or equivalent on the server boundary for the first mutating action in a session.** *Why: client-side trust is insufficient for anything that mutates user data or calendars.*

## Stack & Sibling Convention Patterns

- **Always check the closest sibling project (e.g. `../booking-site/`) for an existing pattern before introducing a new one (folder layout, Server Action shape, Drizzle schema style, auth helpers, Tailwind usage).** *Why: inconsistency across related apps creates maintenance debt and surprising behavior for the operator.*

- **Always prefer Server Components by default.** Add `"use client"` only when interactivity, browser APIs, or React hooks are genuinely required. *Why: pushing work to the server reduces client bundle, improves SEO/perf, and keeps more logic in one place.*

- **Always use Server Actions for mutations.** Wrap return values in a discriminated union `{ ok: true, data } | { ok: false, error }`. *Why: consistent error handling and easy client consumption without ad-hoc shapes.*

- **Always validate Server Action and API inputs with Zod at the boundary.** Never trust client-shaped input even when you control the client. *Why: defense in depth; types lie at runtime and future you (or a coworker) will forget.*

- **Always use Drizzle (or equivalent ORM) and prepared statements for database access.** Never hand-concatenate SQL strings that include user input. *Why: D1 + edge SQL injection is real; prepared statements + ORM also give you type safety.*

## Testing & Quality Gates

- **Always run the full local gate (`pnpm lint && pnpm test` or equivalent) before declaring a change complete.** *Why: the operator commits what you produce; catching type, lint, or test failures immediately prevents broken main.*

- **Always generate and review local DB migrations before suggesting remote application.** Require explicit confirmation for remote. *Why: remote migrations are the highest blast-radius change in most edge apps; local review catches bad schema or data loss.*

- **For UI work on constrained devices (tablets, kiosks, PWAs), always describe the exact manual verification steps on the real hardware.** Never claim touch or layout behavior works without operator confirmation. *Why: you cannot simulate 1340x800 touch + idle dim + PWA install quirks in dev tools.*

## Auth, Data & Google API Patterns (common in personal apps)

- **Always use the authenticated user's own OAuth grant for any read or write to that user's data (calendar, photos, etc.).** Never use a shared service account for per-user resources. *Why: privacy, quota, and auditability all collapse if you mix identities.*

- **Always request the minimum OAuth scopes needed and document them.** *Why: users (and future auditors) should see exactly why access is requested.*

- **Always batch Calendar/Photos API reads by the visible time window.** Never fetch unbounded "all events." *Why: performance and quota; unbounded fetches are the source of slow loads and rate limit pain.*

- **Always handle 401/403 from Google APIs with a graceful re-auth path, not a generic error.** *Why: token expiry is normal; crashing the UI on expiry destroys the always-on experience.*

## AI Feature Patterns (when the app uses LLMs)

- **Always pin the exact model (e.g. `claude-haiku-4-5-20251001` or specific Workers AI model) and fall back explicitly.** *Why: models change or deprecate; pinning makes breakage visible instead of silent quality regression.*

- **Always validate AI-parsed structured output (JSON) with Zod before acting on it.** If validation fails, fall back to a safe manual form pre-filled with what was extracted. *Why: LLM output is untrusted input; acting on bad JSON creates garbage events or data corruption.*

- **Never send more PII or sensitive data to the AI than strictly required for the task.** *Why: cost, privacy, and blast radius all increase when you over-share context.*

- **Always surface token/cost implications for high-volume AI paths and prefer the cheapest viable model for user-scale workloads.** *Why: a "small" feature doing 10k calls a month at $0.015/1k can become real money or a surprise bill.*

## Deploy, Dev, & Environment Patterns

- **Always use the documented deploy command (`pnpm run deploy` or equivalent) and follow any token-unsetting or profile rules the project has established.** *Why: bare `wrangler deploy` or wrong env var state causes the most common "it worked locally" deployment failures.*

- **Never use `--force`, `--no-verify`, or skip hooks unless the operator explicitly asks in the current turn.** *Why: pre-commit hooks exist to protect the project; bypassing them for speed creates long-term pain.*

- **For any work touching production user data or shared state, perform the change locally (or in a reviewable migration) and require explicit confirmation before remote impact.** *Why: "oops, that was prod" is the most expensive class of app bug.*

## Git & Change Discipline

- **Never suggest or perform destructive git operations (`reset --hard`, `push --force`, branch deletes that affect shared branches) without a clear rollback or recovery path stated first.** *Why: the operator's repo is the source of truth; accidental history loss is painful to recover.*

- **Always produce changes that are easy to review (small focused diffs, clear commit messages, tests updated).** *Why: the operator is the one who will git add / commit / push.*

These patterns are derived from real high-signal constraints observed across personal coding projects (Next.js + Workers + D1 + auth + AI + tablet targets + sibling consistency). Adapt wording and applicability to the concrete project being instructed.
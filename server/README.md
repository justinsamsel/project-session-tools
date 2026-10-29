# project-session-tools MCP server

The deterministic half of the skills. Each `SKILL.md` still decides **when** to run and **how** to present. This server handles the file reads, ranking, score math and context-file writes, so the model doesn't have to follow those rules by hand.

| Tool | Used by | Does |
|---|---|---|
| `project_snapshot` | checker Entry Point C, A | Fast read: files present, frontmatter, Current State, newest entries + Next Steps, days since last entry, pinned CURRENT item, primer, newest decision, ticket ids |
| `portfolio_rank` | checker Entry Point F | Ranks active projects: pinned > open work items > stale (most recent first) > blocked > dormant (60+ days) > quiet |
| `health_score` | checker A, B, E | Composite per `health-scoring.md`, weight redistribution, band, display line |
| `health_record` | checker A, B, C (scored) | Writes frontmatter `health` / `last-check` only |
| `stale_items` | SCU Step 1.4 | Open Next Steps / In Progress / Blockers past threshold that no newer entry mentions |
| `status_write` | SCU Step 4 | Current State overwrite, dated block newest-first or same-day merge, frontmatter; returns replaced text + bloat check |
| `status_condense` | SCU anti-bloat | Folds old entries into `## Earlier history (condensed)`, in place, existing rows kept verbatim |
| `decision_append` | SCU Step 4 | Appends after the newest `Title, date` entry; Superseded marker; refuses duplicates |
| `ticket_triage` | ticket-triage Steps 1.5-3 | Merges `filter_tickets` pages (any shape, or saved result files), dedupes, drops descriptions, matches folders, returns matched / needFolders / overdue / upcoming / archiveCheck |
| `ticket_scaffold` | ticket-triage Step 4 | Windows-safe folder, TICKET.md (HTML stripped), scoped CLAUDE.md; skips existing |

The server never calls Freshservice itself; the model does and passes the results in.

Write tools keep each file's own line endings (CRLF stays CRLF) and never touch `health` / `last-check`.

Prompt: `start`.

## Projects folder

The tools look for projects in the first of these that is set:

1. `PROJECT_SESSION_TOOLS_ROOT` env var (`WORKFLOW_PROJECTS_ROOT` also works)
2. `projects_root` in `~/.claude/freshservice-config.json` (ticket-triage writes it)
3. `~/projects`

Every tool also takes an absolute project path.

## Build

The plugin ships a prebuilt single file, `bundle/server.mjs`, that runs on Node 20+ with no install. To build from source:

```powershell
cd server
pnpm install
pnpm build      # dist/ for tests
pnpm test
pnpm bundle     # bundle/server.mjs
node scripts/smoke.mjs <project>   # live check over stdio
```

## Register without the plugin

The plugin registers the server for Claude Code by itself. For other agents, or a source checkout:

```powershell
claude mcp add --scope user -e PROJECT_SESSION_TOOLS_ROOT=<projects folder> project-session-tools -- node <repo>/server/bundle/server.mjs
```

```toml
# ~/.grok/config.toml
[mcp_servers.project-session-tools]
command = "node"
args = ["<repo>/server/bundle/server.mjs"]
env = { PROJECT_SESSION_TOOLS_ROOT = "<projects folder>" }
enabled = true
```

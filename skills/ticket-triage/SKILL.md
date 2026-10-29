---
name: ticket-triage
metadata:
  version: "2026.10.28.3"
description: "Compare Freshservice ticket queue against Claude Project folders. Shows gaps, scaffolds on demand with TICKET.md + CLAUDE.md. Also check another agent's ticket queue and drill into details. Trigger phrases: 'triage my tickets', 'triage tickets', 'ticket triage', 'what tickets need folders', 'scaffold tickets', 'set up my tickets', 'check tickets for {name}', 'what does {name} have', '{name}'s tickets'."
---

# Ticket Triage

Compare the user's Freshservice ticket queue against existing Claude Project folders. Show what's covered. Show what's missing. Scaffold project folders on demand.

**Supporting Utility** (see `references/philosophy.md` in the project root): deliberately lighter than the Core Continuity skills. Do not load Core Continuity `shared-conventions.md`; everything self-triage needs is here. Keep it light unless a deliberate decision promotes it.

**Stay on the asked task.** Do the triage or scaffold the user named. Do not start a checker, builder, or archive run unless they asked. After the report, the only prompt is which tickets to scaffold.

## MCP Tools (use first when present)

The `project-session-tools` server does the merge, folder matching, counting and scaffolding (the tools keep these bare names behind any prefix, such as `mcp__project-session-tools__project_snapshot` or a plugin's `mcp__plugin_project-session-tools_...__project_snapshot`; load them through ToolSearch if deferred). Freshservice calls, agent discovery and report wording stay with you. **Tools not listed:** load `references/no-server.md` and do those steps by hand.

| Tool | Does |
|---|---|
| `ticket_triage` | Steps 1.5, 2, 2.5 (folder side), 3 counts. Pass every `filter_tickets` page inline as `results` or saved files as `resultFiles`. Returns `matched`, `needFolders`, `overdue`, `upcoming`, `archiveCheck` |
| `ticket_scaffold` | Step 4 items 3-7 for one ticket: prefix, Windows-safe folder, TICKET.md, scoped CLAUDE.md. Skips existing folders |

## Entry Points

### Triage (default)

"triage my tickets" or similar. Agent discovery, ticket query, `ticket_triage`, report, then scaffold on request. **References:** none.

### Check Agent Tickets (on-demand)

Triggers: "check tickets for {name}", "what does {name} have", "{name}'s tickets", similar. **References:** `references/agent-queue.md` only; follow it for Steps A-D. Do not load it during self-triage.

---

## Workflow

### Step 0: Agent Discovery

Resolve the operator's Freshservice agent identity. Cached after first successful run.

1. **Check cache.** Read `C:\Users\{username}\.claude\freshservice-config.json` (actual Windows username from CWD). Both `agent_id` and `projects_root`: skip to Step 1. `agent_id` only: step 5a.
2. **Auto-detect via UPN.** `powershell -Command "& 'C:\Windows\System32\whoami.exe' /upn"` (explicit path: bash's `whoami` lacks `/upn`). A value with `@` is the email for step 3.
3. **Look up agent by email.** `filter_agents` with `email:'<upn>'`. 1 result: use it. 0: try 3a.

   **3a. Office registry.** `powershell -Command "(Get-ItemProperty 'HKCU:\Software\Microsoft\Office\16.0\Common\Identity' -ErrorAction SilentlyContinue).ADUserDisplayName"`. Split into first/last and query `filter_agents`.
4. **Manual fallback.** AskUserQuestion for first/last name; if still no match, ask for email.
5. **Cache.** Write `freshservice-config.json` with `agent_id`, `email`, `display_name`, `projects_root`.

   **5a.** If `projects_root` is missing, AskUserQuestion for the Claude Projects folder path and save it.

### Step 1: Query Tickets

**No `filter_tickets` call until Step 0 has a confirmed `agent_id`.**

Pull all unresolved tickets owned by the operator across active workspaces: assigned directly, plus unassigned tickets in the operator's group queues.

1. **Agent details.** `get_agent` with the cached `agent_id`. Take `workspace_ids` and `member_of` (group IDs) fresh every run.
2. **Active workspaces only.** `get_workspace` per ID; proceed only where `state` is `"active"`. Note skipped ones in the report header (e.g., "Skipped 1 draft workspace").
3. **Query each active workspace.**

   **a) Directly assigned:**
   ```
   "agent_id:{agent_id} AND (status:2 OR status:3 OR status:6 OR status:7 OR status:8 OR status:9 OR status:10)"
   ```
   **b) Unassigned group tickets**, per group in `member_of`:
   ```
   "group_id:{group_id} AND agent_id:null AND (status:2 OR status:3 OR status:6 OR status:7 OR status:8 OR status:9 OR status:10)"
   ```
   The outer double quotes are required; without them the API returns 400. Status codes: 2 Open, 3 Pending, 6 In Progress, 7 Change, 8 Problem, 9 Ready for Release, 10 Committee.
4. **Paginate every query.** `page=1,2,3...` until a page returns fewer than 30.
5. **Merge.** `ticket_triage` with every page. Do not process or echo `description` / `description_text`; descriptions are re-fetched per ticket when scaffolding.

### Step 2.5: Archive Check

For each `archiveCheck` folder, `get_ticket_by_id` (never `filter_tickets`: it has no `ticket_id` field and its 400 reads as "not found"). Status 4 (Resolved) or 5 (Closed) = archive candidate: ticket, project name, Freshservice status, frontmatter `status`. Best-effort: skip any ticket that fails; if Freshservice is down, skip the scan. Never fail the triage over it.

### Step 3: Triage Report

```
## Ticket Triage: {date}

**{total} tickets** across {workspace_count} workspace(s) | **{matched} matched** | **{unmatched} need folders**

### Matched (have project folders)

| # | Ticket | Subject | Status | Folder |
|---|--------|---------|--------|--------|
| 1 | INC-000284 | Server migration phase 2 | In Progress | INC-000284 - Server migration... |

### Need Folders

| # | Ticket | Subject | Priority | Status | Age |
|---|--------|---------|----------|--------|-----|
| 1 | INC-000318 | Migrate data from file server | Low | Open | 2d |
```

Then, only when non-empty, in this order:

- **Overdue** (after Need Folders): `| # | Ticket | Subject | Status | Due | Folder | Notes |`, due date followed by "OVERDUE".
- **Upcoming Deadlines** (next 7 days): `| # | Ticket | Subject | Status | Due | Notes |`, e.g. `4/10 (2 days)`.
- **Ready to Archive**: "These Active Projects have Resolved or Closed tickets in Freshservice:" then `| # | Ticket | Project Name | Freshservice Status | Frontmatter status |`. If session-context-updater is available, add: "To archive a project, open it and run session-context-updater Entry Point F (Archive)."

Then prompt: "Which tickets should I scaffold? (e.g., 'all', 'the top 3', 'INC-000318', or pick by number)". No checker, builder, or other-skill offer.

### Step 4: Scaffold Project Folders

Interpret the pick flexibly ("set up the LAPS one", "106204 and 105866", "the top 3", "all"). For each selected ticket:

1. **Fetch fresh.** `get_ticket_by_id` (triage data has no description).
2. **Resolve names.** `get_requester_id` for `requested_for_id` (who the ticket is about) and `requester_id` (who submitted it). If `requested_for_id` is null, use the requester. Display names only, never emails or IDs.
3. **Scaffold.** `ticket_scaffold` with the ticket fields and both names. An unknown-type error means ask the user.
4. **Report:**
   ```
   Created 3 project folders:
     INC-000318 - Migrate data from file server - Robin Hale
     SR-000866 - New laptop setup - Sam Chen
   ```

---

## Self-Check

Revise silently if any fail:

1. `agent_id` confirmed before any `filter_tickets` call
2. Only active workspaces; both direct and group queries run (self-triage)
3. Every `filter_tickets` call paginated until a page returned <30; every page went to `ticket_triage` (or the by-hand merge)
4. Report counts: matched + unmatched = total; ticket data in tables, never bullets
5. Descriptions never processed during triage
6. Scaffolds used a fresh `get_ticket_by_id` and resolved names
7. No existing folder modified; archive check used `get_ticket_by_id`
8. Agent lookup for others: direct queries only; drill-in fetched conversations

## Rules

1. **Never hardcode agent IDs.** Use the discovery chain; multiple agents use this skill.
2. **Never cache `workspace_ids` or `member_of`.** Pull fresh from `get_agent`. Cache only the operator's own identity, after first successful discovery.
3. **Never use `get_tickets`.** It returns tickets system-wide. Always `filter_tickets` scoped by `agent_id` or `group_id`.
4. **A query returning exactly 30 has more pages.** Missing pagination is the most common cause of a wrong report. If a query fails, check the outer quotes first.
5. **Never modify existing project folders.** Create new folders only; matched folders are reported and left alone.
6. **Never auto-archive.** The archive check reports only; archival is session-context-updater Entry Point F, run by the user. Never require or create `PROJECT_REGISTRY.md`.
7. **Other agents' queues:** direct `agent_id` query only, never group queues. Several agents sharing a first name: list all with full name and department and let the user pick. Never cache other agents. Strip HTML from drill-in content.
8. **Absolute paths only.** No `../`, no `%USERPROFILE%` or `$HOME` expansion.
9. **Tables for every ticket list.** Brief notes go in a Notes column.

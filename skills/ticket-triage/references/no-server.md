# Without the MCP server

Load this only when the `project-session-tools` tools are not listed. These are the by-hand versions of `ticket_triage` (Steps 1.5, 2, 2.5 folder side, 3 counts) and `ticket_scaffold` (Step 4 items 3-7). The report and the folders must come out the same.

## Platform

- Use `python`, not `python3`. On Windows `python3` opens a Microsoft Store alias.
- Process ticket data with Python via Bash, `encoding='utf-8'`. Large result sets are saved to disk and need programmatic reading; in-context processing of hundreds of tickets misses results and dedupes wrong. Use Read, Write and Glob for file operations.

## Step 1.5: Combine and deduplicate (replaces `ticket_triage`)

One Python script loads every `filter_tickets` result file, dedupes by ticket `id`, and keeps only `id`, `subject`, `type`, `status`, `priority`, `created_at`, `due_by`, `requester_id`, `requested_for_id`, `workspace_id`, `responder_id`. Print a clean summary table. Drop `description` / `description_text`.

## Step 2: Scan project folders

1. Read `projects_root` from `freshservice-config.json`. Do not derive it from CWD.
2. Glob `*/` on the projects root for immediate subdirectories.
3. Extract ticket numbers from folder names: `INC-\d+`, `SR-\d+`, `MI-\d+`, `CHG-\d+`, `PRB-\d+`. Match on the number only; the rest of the name may follow older conventions. Ignore non-ticket folders entirely (not errors or warnings).
4. Build the set of ticket IDs that already have folders.

## Step 2.5: Archive scan, folder side

For each subfolder with `context/PROJECT_BRIEF.md` or `context/STATUS.md`: identity from frontmatter `project`, else the folder name; ticket number from the folder name. Any recognizable ticket **not** in the unresolved set is an archive check (SKILL.md Step 2.5).

## Step 3: Counts

- matched + unmatched = total.
- **Age** = days since `created_at`. **Due** = `due_by`, blank if none.
- **Overdue** = due date in the past. **Upcoming** = due within the next 7 days.

## Step 4 items 3-7 (replaces `ticket_scaffold`)

3. **Prefix** from `type`: Incident = INC, Service Request = SR, Major Incident = MI, Change = CHG, Problem = PRB. Unrecognized type: ask, do not guess.
4. **Sanitize** subject and name: strip `\ / : * ? " < > |` and trailing spaces/periods.
5. **Folder:** `{PREFIX}-{ID} - {Sanitized Subject} - {Requested For Name}` in the projects root. Never scaffold a folder that already exists.
6. **TICKET.md:**

   ```markdown
   # {PREFIX}-{ID} - {Subject}

   | Field | Value |
   |---|---|
   | Ticket | {PREFIX}-{ID} |
   | Requester | {Requester Name} |
   | Requested For | {Requested For Name} |
   | Priority | {Priority} |
   | Status | {Status} |
   | Category | {Category} |
   | Created | {Created Date} |
   | Due | {Due Date or "None"} |

   ## Description

   {Description text from ticket, HTML stripped}
   ```

   Priority: 1=Low, 2=Medium, 3=High, 4=Urgent. Status: 2=Open, 3=Pending, 6=In Progress, 7=Change, 8=Problem, 9=Ready for Release, 10=Committee.

7. **CLAUDE.md:**

   ```markdown
   # Project Setup

   This project was scaffolded from Freshservice ticket {PREFIX}-{ID}.
   See TICKET.md for ticket details.

   When you want full project instructions, run project-builder
   in this folder. Do not auto-start it from triage.

   ## Scope
   - Do only what TICKET.md asks, plus the minimum needed to deliver it. Never add cleanups, hardening, docs or extra fixes, even if useful.
   - If you notice something outside the ask, report it in one line and carry on. Never act on it.
   - If the ask needs much bigger work than the ticket implies, ask first (popup, recommendation first).

   ## Working style
   - On "start", run the project-status-checker skill first, even if a primer names the first move.
   - Replies: one line of state, then numbered Next steps (1-3). At most two sentences of explanation.
   - Every decision the user must make goes in a popup (AskUserQuestion), recommendation first. Never end with "tell me when".
   - Before giving steps for a UI, capture the screen and give only the next 1-3 steps.
   ```

Always write both files. A folder without both is incomplete.

# Check Agent Tickets (on-demand)

Load this reference **only** when the user asks about another agent's queue (not self-triage).

**Trigger phrases:** "check tickets for {name}", "what tickets does {name} have", "show me {name}'s queue", "{name}'s tickets"

This is a separate flow from self-triage. No folder matching, no scaffolding.

## Step A: Agent Lookup

Resolve the target agent by name.

1. **Parse the name.** Extract whatever the user provided. Could be first name only ("Robin"), full name ("Robin Hale"), or partial ("Jamie P").

2. **Search Freshservice.** Use `filter_agents` with a query built from the input:
   - Full name provided: `first_name:'{first}' AND last_name:'{last}'`
   - First name only: `first_name:'{first}'`
   - If first-name-only returns multiple results, present the matches and ask the user to pick. Show each agent's full name and department to disambiguate.

3. **Confirm match.** If exactly one result, proceed. If zero results, ask the user to try a different name.

## Step B: Query Agent Tickets

Same as self-triage Step 1 with two differences: (1) use the target agent's ID instead of the operator's, (2) run only direct-assignment queries (no group queue queries). Paginate, merge with `ticket_triage` (or Python per `no-server.md` without the server), and discard descriptions per the same rules as the main SKILL.

## Step C: Agent Ticket Report

Present the target agent's ticket queue.

**Format:**

```
## {Agent Name}'s Tickets: {date}

**{total} tickets** across {workspace_count} workspace(s) | {open_count} Open | {pending_count} Pending | {in_progress_count} In Progress | ...

| # | Ticket | Subject | Priority | Status | Age |
|---|--------|---------|----------|--------|-----|
| 1 | INC-000318 | Migrate data from file server | Low | Open | 2d |
| 2 | SR-000866 | New laptop setup | Medium | Pending | 14d |
```

Only include status categories that have tickets (skip zero counts in the summary line).

After displaying the report, prompt: "Pick a ticket number to see full details, or ask anything about this queue."

## Step D: Ticket Drill-In

The user picks a ticket from the report. Fetch and display full details.

1. **Fetch full ticket.** Call `get_ticket_by_id` with the ticket's numeric ID.

2. **Resolve names.** Look up `requester_id` and `requested_for_id` via `get_requester_id` to get display names.

3. **Fetch recent comments.** Call `list_all_ticket_conversation` for the ticket. From the results, extract:
   - The most recent reply or note from the assigned agent
   - The most recent reply or note from the requester
   If either has no comments, note that (e.g., "No agent replies yet").

4. **Present details:**

   ```
   ## INC-000318 - Migrate data from file server

   | Field | Value |
   |---|---|
   | Assigned To | Robin Hale |
   | Requester | Robin Hale |
   | Requested For | Robin Hale |
   | Priority | Low |
   | Status | Open |
   | Category | Software |
   | Created | Apr 2, 2026 |
   | Due | Apr 12, 2026 |

   ### Description

   {Description text, stripped of HTML}

   ### Latest from Agent

   {Most recent agent comment, with date}

   ### Latest from Requester

   {Most recent requester comment, with date}
   ```

5. **Offer next actions.** After displaying: "Want to see the full conversation history, or check another ticket?"

## Agent-queue rules (from main SKILL)

- Never query unassigned group tickets for other agents.
- Handle first-name-only lookups gracefully (disambiguate; never guess).
- Never cache other agents' identities.
- Strip HTML from drill-in content.

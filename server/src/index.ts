#!/usr/bin/env node
// project-session-tools MCP server: the deterministic half of the project session skills.
// The SKILL.md files keep triggering and judgment; these tools do the reading, ranking and math.
// stdout is the MCP channel: log only with console.error.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  DEFAULT_ROOT,
  composite,
  freshness,
  looksLikeProject,
  portfolio,
  recordHealth,
  resolveProject,
  snapshot,
} from "./context.js";
import { appendDecision, condenseStatus, staleItems, writeStatus } from "./writer.js";
import { collectTickets, loadTicketFiles, scaffold, ticketsRoot, triage } from "./tickets.js";

const server = new McpServer(
  { name: "project-session-tools", version: "0.2.0" },
  {
    instructions:
      "Deterministic tools for the project-session-tools skills (project-status-checker, later session-context-updater and ticket-triage). " +
      "The matching skill decides when to run and how to present; call these tools for file reads, ranking and score math instead of doing them by hand. " +
      `Projects root: ${DEFAULT_ROOT}.`,
  },
);

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(error: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
    isError: true,
  };
}

function projectDir(project?: string): string {
  if (project) return resolveProject(project);
  const cwd = process.cwd();
  if (looksLikeProject(cwd)) return cwd;
  throw new Error("No project given and the server's working folder is not a project. Pass `project`.");
}

server.registerTool(
  "project_snapshot",
  {
    title: "Project snapshot",
    description:
      "Fast read of one project for a session Start (checker Entry Point C) or Quick Check: which context files exist, " +
      "BRIEF/STATUS frontmatter, the STATUS Current State, newest dated entries with their Next Steps, days since the last entry, " +
      "the pinned work/CURRENT.md item, the next-session primer, the newest decision heading, and INC/SR/MI ticket ids. " +
      "Resolves a folder name, a ticket number or an absolute path under the projects root (and the sibling tickets folder).",
    inputSchema: {
      project: z.string().optional().describe("Project folder name, ticket number (INC-000123), or absolute path. Omit to use the working folder."),
      entries: z.number().int().min(1).max(10).optional().describe("How many newest STATUS entries to return (default 2)."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ project, entries }) => {
    try {
      return ok(snapshot(projectDir(project), entries ?? 2));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "portfolio_rank",
  {
    title: "Portfolio rank",
    description:
      "Rank active projects for 'which project today' (checker Entry Point F). Tiers, highest first: pinned work/CURRENT.md item, " +
      "open ready/in-progress work items, active but stale (7+ days since the last STATUS entry, most recent first), open blockers, " +
      "dormant (60+ days, likely parked), quiet. " +
      "Skips archived, completed and cancelled projects. Returns light signals only; the model writes each First Move.",
    inputSchema: {
      root: z.string().optional().describe(`Folder holding the projects (default ${DEFAULT_ROOT}).`),
      top: z.number().int().min(1).max(50).optional().describe("How many to return (default 5)."),
      staleDays: z.number().int().min(1).optional().describe("Days without a STATUS entry that count as stale (default 7)."),
      dormantDays: z.number().int().min(2).optional().describe("Days without a STATUS entry that count as dormant and rank below blockers (default 60)."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ root, top, staleDays, dormantDays }) => {
    try {
      const all = portfolio(root ?? DEFAULT_ROOT, staleDays ?? 7, dormantDays ?? 60);
      return ok({ considered: all.length, ranked: all.slice(0, top ?? 5) });
    } catch (e) {
      return fail(e);
    }
  },
);

const score = z.number().min(0).max(100);

server.registerTool(
  "health_score",
  {
    title: "Health score",
    description:
      "Composite health score per health-scoring.md: weighted average of the dimensions you scored, weights redistributed for skipped ones, " +
      "band word, and a display line. Pass a dimension only when its data source was available. " +
      "Freshness can be given directly or as its raw inputs, which this tool scores.",
    inputSchema: {
      freshness: score.optional(),
      freshnessInputs: z
        .object({
          daysSinceLastEntry: z.number().int().min(0),
          staleItems: z.number().int().min(0),
          openItems: z.number().int().min(0),
          blockersOver14Days: z.number().int().min(0),
        })
        .optional()
        .describe("Raw Freshness inputs; used when `freshness` is omitted."),
      completeness: score.optional(),
      decisionCoverage: score.optional(),
      consistency: score.optional(),
      ticketAlignment: score.optional().describe("Only when Freshservice was probed."),
      instructionsAlignment: score.optional().describe("Only when project instructions exist."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ freshnessInputs, ...scores }) => {
    try {
      if (scores.freshness === undefined && freshnessInputs) {
        const f = freshnessInputs;
        scores.freshness = freshness(f.daysSinceLastEntry, f.staleItems, f.openItems, f.blockersOver14Days);
      }
      return ok({ dimensions: scores, ...composite(scores) });
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "health_record",
  {
    title: "Record health",
    description:
      "The checker's only write: set frontmatter `health` and `last-check` on PROJECT_BRIEF.md (and STATUS.md if it has frontmatter) " +
      "after a scored single-project run. Never touches file bodies; files without frontmatter are skipped.",
    inputSchema: {
      project: z.string().describe("Project folder name, ticket number, or absolute path."),
      score: z.number().int().min(0).max(100),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ project, score }) => {
    try {
      const dir = resolveProject(project);
      return ok({ project: dir, written: recordHealth(dir, score) });
    } catch (e) {
      return fail(e);
    }
  },
);

// ---------- session-context-updater (End) ----------

const bulletList = z.array(z.string()).optional();

server.registerTool(
  "status_write",
  {
    title: "Write STATUS entry",
    description:
      "Session wrap-up write to STATUS.md (session-context-updater Step 4). Overwrites Current State in place when given, inserts a new dated " +
      "`## YYYY-MM-DD, label` block newest-first (or merges new bullets into today's block with the same label), refreshes frontmatter " +
      "`last-updated` (and `status` when `phase` is given), and keeps health/last-check untouched. Returns a bloat check; when `bloat.needed` " +
      "is true, write one-line outcomes for `bloat.wouldCondense` and call status_condense. Bullets must be specific and actionable.",
    inputSchema: {
      project: z.string().describe("Project folder name, ticket number, or absolute path."),
      label: z.string().describe("Short session label for the heading, e.g. 'MCP server pilot'."),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Entry date, default today (local)."),
      currentState: z
        .string()
        .optional()
        .describe(
          "Replaces the WHOLE Current State section (specific one-liner + phase). Carry forward any lines in it that are still true; " +
            "the old text comes back as replacedCurrentState so you can check nothing live was dropped.",
        ),
      phase: z.string().optional().describe("Frontmatter status to set, e.g. active, on-hold, complete."),
      completed: bulletList,
      inProgress: bulletList,
      blockers: bulletList,
      nextSteps: bulletList,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ project, ...input }) => {
    try {
      return ok(writeStatus(resolveProject(project), input));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "status_condense",
  {
    title: "Condense STATUS",
    description:
      "STATUS anti-bloat: keep Current State and the newest `keep` dated entries, fold older ones into `## Earlier history (condensed)` " +
      "(Date | Outcome table, existing rows kept). The model supplies one-line outcomes per folded date; a missing one falls back to the entry label. " +
      "The only whole-file STATUS rewrite.",
    inputSchema: {
      project: z.string(),
      outcomes: z
        .array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), outcome: z.string() }))
        .describe("One-line outcome per folded entry, from status_write's bloat.wouldCondense."),
      keep: z
        .number()
        .int()
        .min(3)
        .max(10)
        .optional()
        .describe("Dated entries to keep in full. Default: 6, or 5 when 6 still leaves STATUS over 120 lines (matches bloat.wouldCondense)."),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ project, outcomes, keep }) => {
    try {
      return ok(condenseStatus(resolveProject(project), outcomes, keep));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "decision_append",
  {
    title: "Append decision",
    description:
      "Append a decision to DECISIONS.md in the file's own heading level (`### Title, YYYY-MM-DD` with Context / Decision / Alternatives / Implications). " +
      "With `supersedes`, also adds a `**Superseded:**` marker under the one older heading that matches. Refuses an exact duplicate title + date.",
    inputSchema: {
      project: z.string(),
      title: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      context: z.string(),
      decision: z.string(),
      alternatives: z.string().optional(),
      implications: z.string().optional(),
      supersedes: z.string().optional().describe("Title (or unique part of it) of the decision this replaces."),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ project, ...input }) => {
    try {
      return ok(appendDecision(resolveProject(project), input));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "stale_items",
  {
    title: "Stale STATUS items",
    description:
      "Open Next Steps / In Progress older than `thresholdDays` (default 14) and Blockers older than `blockerDays` (default 7) that no newer " +
      "STATUS entry mentions again. Skips the newest entry and On Hold / Cancelled projects. Oldest first; the card shows at most 3.",
    inputSchema: {
      project: z.string(),
      thresholdDays: z.number().int().min(1).optional(),
      blockerDays: z.number().int().min(1).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ project, thresholdDays, blockerDays }) => {
    try {
      return ok(staleItems(resolveProject(project), thresholdDays ?? 14, blockerDays ?? 7));
    } catch (e) {
      return fail(e);
    }
  },
);

// ---------- ticket-triage ----------

server.registerTool(
  "ticket_triage",
  {
    title: "Ticket triage",
    description:
      "ticket-triage Steps 1.5, 2, 2.5 and 3 in one call. Merges Freshservice filter_tickets results (inline and/or saved result files), " +
      "dedupes by id, drops descriptions, matches ticket numbers to INC/SR/MI/CHG/PRB folders under the projects root, and returns report data: " +
      "counts, matched, needFolders, overdue, upcoming (7 days), and archiveCheck (ticket folders not in the unresolved set; check each with " +
      "get_ticket_by_id, status 4 or 5 = Ready to Archive). Replaces the Python merge step. The model still renders the report tables.",
    inputSchema: {
      results: z.unknown().optional().describe("filter_tickets results as returned (any shape: array, {tickets}, or JSON text)."),
      resultFiles: z.array(z.string()).optional().describe("Absolute paths of saved tool-result files holding filter_tickets output."),
      root: z.string().optional().describe("Projects root; default projects_root from ~/.claude/freshservice-config.json."),
      upcomingDays: z.number().int().min(1).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ results, resultFiles, root, upcomingDays }) => {
    try {
      const { tickets, unreadable } = loadTicketFiles(resultFiles ?? []);
      if (results !== undefined) collectTickets(results, tickets);
      const report = triage([...tickets.values()], ticketsRoot(root), undefined, upcomingDays ?? 7);
      return ok({ ...report, unreadableFiles: unreadable });
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "ticket_scaffold",
  {
    title: "Scaffold ticket folder",
    description:
      "ticket-triage Step 4 for one ticket: maps type to prefix (unknown type = error, ask the user), builds the Windows-safe " +
      "`{PREFIX}-{ID} - {Subject} - {Requested For}` folder, writes TICKET.md (HTML stripped from the description) and the scoped CLAUDE.md. " +
      "Skips a ticket that already has a folder. Pass fields from a fresh get_ticket_by_id and the resolved requester names.",
    inputSchema: {
      root: z.string().optional(),
      id: z.number().int(),
      type: z.string().describe("Freshservice type, e.g. Incident, Service Request."),
      subject: z.string(),
      requesterName: z.string(),
      requestedForName: z.string().optional().describe("Name for requested_for_id; used in the folder name when present."),
      priority: z.union([z.number(), z.string()]).optional(),
      status: z.union([z.number(), z.string()]).optional(),
      category: z.string().optional(),
      createdAt: z.string().optional(),
      dueBy: z.string().optional(),
      description: z.string().optional().describe("Ticket description (HTML is fine)."),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ root, ...input }) => {
    try {
      return ok(scaffold(ticketsRoot(root), input));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerPrompt(
  "start",
  {
    title: "Start a project session",
    description: "Open a work session on one project (project-status-checker Entry Point C).",
    argsSchema: { project: z.string().optional().describe("Project folder name or ticket number") },
  },
  ({ project }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `start${project ? " " + project : ""}\n\nUse the project-status-checker skill, Entry Point C. Call the project-session-tools project_snapshot tool for the fast read.`,
        },
      },
    ],
  }),
);

async function main() {
  await server.connect(new StdioServerTransport());
  console.error("project-session-tools MCP running on stdio");
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});

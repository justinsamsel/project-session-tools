// ticket-triage support: merge Freshservice results, match them to project folders, scaffold new folders.
// The server never calls Freshservice; the model does, and hands the results (or saved result files) here.

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { configRoot, contextFile, daysBetween, parseFrontmatter, read, today } from "./context.js";

export const PREFIX: Record<string, string> = {
  incident: "INC",
  "service request": "SR",
  "major incident": "MI",
  change: "CHG",
  problem: "PRB",
};
export const STATUS: Record<number, string> = {
  2: "Open", 3: "Pending", 4: "Resolved", 5: "Closed", 6: "In Progress", 7: "Change", 8: "Problem", 9: "Ready for Release", 10: "Committee",
};
export const PRIORITY: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Urgent" };

const FOLDER_TICKET = /\b(INC|SR|MI|CHG|PRB)-(\d+)\b/gi;
const KEEP = ["id", "subject", "type", "status", "priority", "created_at", "due_by", "requester_id", "requested_for_id", "workspace_id", "responder_id"] as const;

export type Ticket = Partial<Record<(typeof KEEP)[number], unknown>> & { id: number };

// ---------- projects root ----------

/** projects_root from ~/.claude/freshservice-config.json (the skill's Step 0 cache). */
export function ticketsRoot(explicit?: string): string {
  if (explicit) return explicit;
  const root = configRoot();
  if (root) return root;
  throw new Error("No projects_root: pass `root`, or finish ticket-triage Step 0 so freshservice-config.json has it.");
}

// ---------- merging Freshservice results ----------

/** Walk any JSON shape (array, {tickets: []}, MCP content wrappers, JSON inside strings) and collect ticket objects. */
export function collectTickets(source: unknown, out: Map<number, Ticket> = new Map()): Map<number, Ticket> {
  if (typeof source === "string") {
    const s = source.trim();
    if (s.startsWith("{") || s.startsWith("[")) {
      try {
        collectTickets(JSON.parse(s), out);
      } catch {
        /* not JSON */
      }
    }
  } else if (Array.isArray(source)) {
    for (const x of source) collectTickets(x, out);
  } else if (source && typeof source === "object") {
    const o = source as Record<string, unknown>;
    if (typeof o.id === "number" && typeof o.subject === "string") {
      const t: Ticket = { id: o.id };
      for (const k of KEEP) if (k in o) (t as Record<string, unknown>)[k] = o[k]; // description fields are never copied
      out.set(o.id, t);
    } else {
      for (const v of Object.values(o)) collectTickets(v, out);
    }
  }
  return out;
}

export function loadTicketFiles(paths: string[]): { tickets: Map<number, Ticket>; unreadable: string[] } {
  const tickets = new Map<number, Ticket>();
  const unreadable: string[] = [];
  for (const p of paths) {
    const text = read(p);
    if (text === null) unreadable.push(p);
    else collectTickets(text, tickets);
  }
  return { tickets, unreadable };
}

// ---------- folders ----------

export interface TicketFolder {
  number: string;
  folder: string;
  path: string;
  project: string;
  phase: string | null;
}

/** Ticket-numbered folders under root, keyed by ticket number (prefix may differ from the API type). */
export function ticketFolders(root: string): Map<string, TicketFolder> {
  const out = new Map<string, TicketFolder>();
  if (!existsSync(root)) throw new Error(`Projects root not found: ${root}`);
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const m of d.name.matchAll(FOLDER_TICKET)) {
      const path = join(root, d.name);
      const brief = contextFile(path, "PROJECT_BRIEF.md") ?? contextFile(path, "STATUS.md");
      const fm = brief ? parseFrontmatter(read(brief) ?? "").data : {};
      out.set(m[2], { number: m[2], folder: d.name, path, project: fm.project || d.name, phase: fm.status || null });
    }
  }
  return out;
}

// ---------- triage report data ----------

function dateOf(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
}

export function prefixFor(type: unknown): string | null {
  return typeof type === "string" ? PREFIX[type.trim().toLowerCase()] ?? null : null;
}

export function triage(tickets: Ticket[], root: string, asOf: string = today(), upcomingDays = 7) {
  const folders = ticketFolders(root);
  const open = new Set(tickets.map((t) => String(t.id)));
  const rows = tickets
    .map((t) => {
      const prefix = prefixFor(t.type);
      const due = dateOf(t.due_by);
      const created = dateOf(t.created_at);
      const dueIn = due ? daysBetween(asOf, due) : null;
      const folder = folders.get(String(t.id));
      return {
        id: t.id,
        ticket: prefix ? `${prefix}-${t.id}` : `?-${t.id}`,
        subject: t.subject ?? "",
        type: t.type ?? null,
        status: STATUS[Number(t.status)] ?? String(t.status ?? ""),
        priority: PRIORITY[Number(t.priority)] ?? String(t.priority ?? ""),
        ageDays: created ? daysBetween(created, asOf) : null,
        due,
        dueInDays: dueIn,
        overdue: dueIn !== null && dueIn < 0,
        folder: folder?.folder ?? null,
        workspaceId: t.workspace_id ?? null,
      };
    })
    .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));

  const matched = rows.filter((r) => r.folder);
  const needFolders = rows.filter((r) => !r.folder);
  // Folders whose ticket is not in the unresolved set: the model checks each with get_ticket_by_id.
  const archiveCheck = [...folders.values()].filter((f) => !open.has(f.number) && f.phase !== "archived");

  return {
    asOf,
    root,
    counts: { total: rows.length, matched: matched.length, needFolders: needFolders.length, unknownType: rows.filter((r) => r.ticket.startsWith("?")).length },
    matched,
    needFolders,
    overdue: rows.filter((r) => r.overdue),
    upcoming: rows.filter((r) => r.dueInDays !== null && r.dueInDays >= 0 && r.dueInDays <= upcomingDays),
    archiveCheck,
  };
}

// ---------- scaffolding ----------

export function sanitize(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim().replace(/[ .]+$/, "");
}

export function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface ScaffoldInput {
  id: number;
  type: string;
  subject: string;
  requesterName: string;
  requestedForName?: string;
  priority?: number | string;
  status?: number | string;
  category?: string;
  createdAt?: string;
  dueBy?: string;
  description?: string;
}

const CLAUDE_MD = (key: string) => `# Project Setup

This project was scaffolded from Freshservice ticket ${key}.
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
`;

export function scaffold(root: string, t: ScaffoldInput) {
  const prefix = prefixFor(t.type);
  if (!prefix) throw new Error(`Unrecognized ticket type "${t.type}". Ask the user for the prefix (INC, SR, MI, CHG, PRB).`);
  const key = `${prefix}-${t.id}`;
  const existing = ticketFolders(root).get(String(t.id));
  if (existing) return { ticket: key, action: "skipped", reason: "folder already exists", folder: existing.folder };

  const folder = `${key} - ${sanitize(t.subject)} - ${sanitize(t.requestedForName || t.requesterName)}`;
  const path = join(root, folder);
  mkdirSync(path, { recursive: false });

  const val = (v: unknown, map?: Record<number, string>) =>
    v === undefined || v === null || v === "" ? "None" : map && map[Number(v)] ? map[Number(v)] : String(v);
  const ticketMd = [
    `# ${key} - ${t.subject.trim()}`,
    "",
    "| Field | Value |",
    "|---|---|",
    `| Ticket | ${key} |`,
    `| Requester | ${t.requesterName} |`,
    `| Requested For | ${t.requestedForName || t.requesterName} |`,
    `| Priority | ${val(t.priority, PRIORITY)} |`,
    `| Status | ${val(t.status, STATUS)} |`,
    `| Category | ${val(t.category)} |`,
    `| Created | ${val(dateOf(t.createdAt) ?? t.createdAt)} |`,
    `| Due | ${val(dateOf(t.dueBy) ?? t.dueBy)} |`,
    "",
    "## Description",
    "",
    t.description ? stripHtml(t.description) : "(no description)",
    "",
  ].join("\n");

  writeFileSync(join(path, "TICKET.md"), ticketMd, "utf8");
  writeFileSync(join(path, "CLAUDE.md"), CLAUDE_MD(key), "utf8");
  return { ticket: key, action: "created", folder, path, files: [join(path, "TICKET.md"), join(path, "CLAUDE.md")] };
}

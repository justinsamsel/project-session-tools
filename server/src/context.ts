// Reading and light-writing of a project's context files (BRIEF / STATUS / DECISIONS,
// work/CURRENT.md, next-session primer). Pure file logic, no MCP here, so it can be tested.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";

/** projects_root from ~/.claude/freshservice-config.json (ticket-triage Step 0 writes it), or null. */
export function configRoot(): string | null {
  try {
    const root = JSON.parse(readFileSync(join(homedir(), ".claude", "freshservice-config.json"), "utf8")).projects_root;
    return typeof root === "string" && root ? root : null;
  } catch {
    return null;
  }
}

// Env var first (WORKFLOW_PROJECTS_ROOT is the older name), then ticket-triage's config, then ~/projects.
export const DEFAULT_ROOT =
  process.env.PROJECT_SESSION_TOOLS_ROOT || process.env.WORKFLOW_PROJECTS_ROOT || configRoot() || join(homedir(), "projects");

const SKIP_DIRS = new Set(["archive", "Archived", ".claude", "_templates"]);
const CLOSED_STATUSES = new Set(["archived", "completed", "complete", "cancelled", "canceled", "done"]);
const DATE_RE = /(\d{4}-\d{2}-\d{2})/;
const TICKET_RE = /\b(?:INC|SR|MI)-\d{3,}\b/g;

export type Frontmatter = Record<string, string>;

export interface StatusEntry {
  date: string;
  heading: string;
  nextSteps: string[];
  inProgress: string[];
  blockers: string[];
  text: string;
}

export interface Snapshot {
  project: string;
  path: string;
  files: { brief: boolean; status: boolean; decisions: boolean; claudeMd: boolean; currentMd: boolean };
  frontmatter: { brief: Frontmatter; status: Frontmatter };
  currentState: string | null;
  newestEntries: Omit<StatusEntry, "text">[];
  lastEntryDate: string | null;
  daysSinceLastEntry: number | null;
  pinnedItem: string | null;
  primer: { file: string; date: string | null; text: string } | null;
  newestDecision: string | null;
  ticketIds: string[];
  notes: string[];
}

// ---------- small helpers ----------

export function read(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/** Local calendar date; toISOString() would roll to tomorrow on a US evening. */
export function today(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(from: string, to: string = today()): number {
  const ms = Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z");
  return Math.round(ms / 86_400_000);
}

/** Top-level `key: value` pairs only. Nested lists are skipped, which is all the checker needs. */
export function parseFrontmatter(text: string): { data: Frontmatter; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: {}, body: text };
  const data: Frontmatter = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { data, body: text.slice(m[0].length) };
}

/** Set (or add) top-level frontmatter keys without touching the body. */
export function setFrontmatter(text: string, updates: Record<string, string>): string {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return text; // no frontmatter: the checker never adds one
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = m[1].split(/\r?\n/);
  for (const [key, value] of Object.entries(updates)) {
    const i = lines.findIndex((l) => l.startsWith(key + ":"));
    if (i >= 0) lines[i] = `${key}: ${value}`;
    else lines.push(`${key}: ${value}`);
  }
  return `---${eol}${lines.join(eol)}${eol}---` + text.slice(m[0].length);
}

export function contextFile(dir: string, name: string): string | null {
  for (const p of [join(dir, "context", name), join(dir, name)]) if (existsSync(p)) return p;
  return null;
}

// ---------- STATUS parsing ----------

/** Text of the Current State / Current phase section, or the bold lead line before the first entry. */
export function currentState(body: string, maxChars = 600): string | null {
  const sec = /^##\s+Current (?:State|phase)\s*\r?\n([\s\S]*?)(?=^##\s|^---\s*$)/im.exec(body);
  let text = sec?.[1].trim() ?? null;
  if (!text) {
    const lead = /^\*\*(?:Overall Phase|Current State|Phase)[^*]*\*\*.*$/im.exec(body);
    text = lead?.[0].trim() ?? null;
  }
  if (!text) return null;
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + " ..." : text;
}

/** Dated `##` / `###` entries, newest first. */
export function statusEntries(body: string): StatusEntry[] {
  const out: StatusEntry[] = [];
  const parts = body.split(/^(?=#{2,3}\s)/m);
  for (const part of parts) {
    const head = /^#{2,3}\s+(.*)$/m.exec(part);
    if (!head) continue;
    const date = DATE_RE.exec(head[1]);
    if (!date) continue;
    out.push({
      date: date[1],
      heading: head[1].trim(),
      nextSteps: subsection(part, "Next Steps?"),
      inProgress: subsection(part, "In Progress"),
      blockers: subsection(part, "Blockers?"),
      text: part,
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/** Bullets under a `**Name:**` label inside one STATUS entry. */
export function subsection(entry: string, name: string): string[] {
  const re = new RegExp(`\\*\\*${name}:?\\*\\*:?\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n\\s*\\r?\\n|\\r?\\n\\*\\*|$)`, "i");
  const m = re.exec(entry);
  if (!m) return [];
  return m[1]
    .split(/\r?\n/)
    .filter((l) => /^\s*[-*]\s+/.test(l))
    .map((l) => l.replace(/^\s*[-*]\s*(\[.\]\s*)?/, "").trim())
    .filter(Boolean);
}

function newestDecision(text: string | null): string | null {
  if (!text) return null;
  const heads = [...text.matchAll(/^#{2,3}\s+(.*\d{4}-\d{2}-\d{2}.*)$/gm)].map((m) => m[1].trim());
  if (!heads.length) return null;
  return heads.sort((a, b) => (DATE_RE.exec(b)?.[1] ?? "").localeCompare(DATE_RE.exec(a)?.[1] ?? ""))[0];
}

function pinnedItem(dir: string): string | null {
  const text = read(join(dir, "work", "CURRENT.md"));
  if (!text) return null;
  const m = /\*\*Active item:\*\*\s*(.+)$/m.exec(text);
  if (!m) return null;
  const v = m[1].trim();
  return /^_?\(none/i.test(v) || v === "" ? null : v;
}

function primer(dir: string): Snapshot["primer"] {
  const folder = join(dir, "context", "prompts", "next-session");
  const latest = join(folder, "latest.md");
  let file: string | null = existsSync(latest) ? latest : null;
  if (!file && existsSync(folder)) {
    const md = readdirSync(folder).filter((f) => f.endsWith(".md")).sort();
    if (md.length) file = join(folder, md[md.length - 1]);
  }
  if (!file) return null;
  const text = read(file) ?? "";
  const date = DATE_RE.exec(basename(file))?.[1] ?? today(statSync(file).mtime);
  return { file, date, text: text.length > 2500 ? text.slice(0, 2500) + "\n..." : text };
}

// ---------- project resolution ----------

/** Resolve a project from an absolute path, a folder name under root, or a ticket number. */
export function resolveProject(ref: string, root: string = DEFAULT_ROOT): string {
  if (isAbsolute(ref) && existsSync(ref)) return resolve(ref);
  const roots = [root, join(root, "..", "tickets")].filter((r) => existsSync(r));
  const lower = ref.toLowerCase();
  for (const r of roots) {
    const dirs = readdirSync(r, { withFileTypes: true }).filter((d) => d.isDirectory());
    const exact = dirs.find((d) => d.name.toLowerCase() === lower);
    if (exact) return join(r, exact.name);
  }
  for (const r of roots) {
    const dirs = readdirSync(r, { withFileTypes: true }).filter((d) => d.isDirectory());
    const partial = dirs.filter((d) => d.name.toLowerCase().includes(lower));
    if (partial.length === 1) return join(r, partial[0].name);
    if (partial.length > 1)
      throw new Error(`"${ref}" matches several folders: ${partial.map((d) => d.name).join(", ")}`);
  }
  throw new Error(`No project or ticket folder matches "${ref}" under ${roots.join(" or ")}`);
}

export function looksLikeProject(dir: string): boolean {
  return (
    existsSync(join(dir, "context")) ||
    existsSync(join(dir, "CLAUDE.md")) ||
    contextFile(dir, "STATUS.md") !== null ||
    contextFile(dir, "PROJECT_BRIEF.md") !== null
  );
}

// ---------- snapshot (Entry Point C fast read) ----------

export function snapshot(dir: string, entries = 2): Snapshot {
  const notes: string[] = [];
  const briefPath = contextFile(dir, "PROJECT_BRIEF.md");
  const statusPath = contextFile(dir, "STATUS.md");
  const decisionsPath = contextFile(dir, "DECISIONS.md");
  const claudePath = join(dir, "CLAUDE.md");

  const briefText = briefPath ? read(briefPath) : null;
  const statusText = statusPath ? read(statusPath) : null;
  const decisionsText = decisionsPath ? read(decisionsPath) : null;
  const brief = briefText ? parseFrontmatter(briefText) : { data: {}, body: "" };
  const status = statusText ? parseFrontmatter(statusText) : { data: {}, body: "" };

  const all = statusEntries(status.body);
  let lastEntryDate = all[0]?.date ?? null;
  if (!lastEntryDate && status.data["last-updated"]) {
    lastEntryDate = status.data["last-updated"];
    notes.push("No dated STATUS entries; used frontmatter last-updated.");
  }
  if (!statusPath && !briefPath) notes.push("No context files. Offer bootstrap (SCU Entry Point B or project-builder).");

  const tickets = new Set<string>();
  for (const t of [briefText, statusText, decisionsText]) for (const m of t?.matchAll(TICKET_RE) ?? []) tickets.add(m[0]);

  const p = primer(dir);
  if (p && lastEntryDate && p.date && p.date < lastEntryDate)
    notes.push(`Primer (${p.date}) is older than the newest STATUS entry (${lastEntryDate}); trust STATUS.`);

  return {
    project: basename(dir),
    path: dir,
    files: {
      brief: !!briefPath,
      status: !!statusPath,
      decisions: !!decisionsPath,
      claudeMd: existsSync(claudePath),
      currentMd: existsSync(join(dir, "work", "CURRENT.md")),
    },
    frontmatter: { brief: brief.data, status: status.data },
    currentState: currentState(status.body),
    newestEntries: all.slice(0, entries).map(({ text, ...e }) => e),
    lastEntryDate,
    daysSinceLastEntry: lastEntryDate ? daysBetween(lastEntryDate) : null,
    pinnedItem: pinnedItem(dir),
    primer: p,
    newestDecision: newestDecision(decisionsText),
    ticketIds: [...tickets].sort(),
    notes,
  };
}

// ---------- portfolio (Entry Point F) ----------

export interface Candidate {
  project: string;
  path: string;
  rank: number;
  tier: "pinned" | "open-items" | "stale" | "blocked" | "dormant" | "quiet";
  reason: string;
  status: string | null;
  health: number | null;
  lastEntryDate: string | null;
  daysSinceLastEntry: number | null;
  pinnedItem: string | null;
  openWorkItems: string[];
  nextSteps: string[];
}

function openWorkItems(dir: string): string[] {
  const work = join(dir, "work");
  if (!existsSync(work)) return [];
  const out: string[] = [];
  for (const f of readdirSync(work)) {
    if (!f.endsWith(".md") || f === "CURRENT.md" || f === "inbox.md") continue;
    const fm = parseFrontmatter(read(join(work, f)) ?? "").data;
    if (fm.status === "ready" || fm.status === "in-progress") out.push(fm.title || f.replace(/\.md$/, ""));
  }
  return out;
}

function hasBlockers(statusBody: string): boolean {
  const sec = /^##\s+Blockers\s*\r?\n([\s\S]*?)(?=^##\s|^---\s*$|$(?![\s\S]))/im.exec(statusBody);
  if (!sec) return false;
  const lines = sec[1].split(/\r?\n/).filter((l) => /^\s*[-*]\s+\S/.test(l) && !/\bnone\b/i.test(l));
  return lines.length > 0;
}

export function portfolio(root: string = DEFAULT_ROOT, staleDays = 7, dormantDays = 60): Candidate[] {
  const out: Candidate[] = [];
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith(".") || SKIP_DIRS.has(d.name)) continue;
    const dir = join(root, d.name);
    if (!contextFile(dir, "STATUS.md") && !contextFile(dir, "PROJECT_BRIEF.md")) continue;

    const s = snapshot(dir, 1);
    const status = (s.frontmatter.brief.status || s.frontmatter.status.status || "").toLowerCase() || null;
    if (status && CLOSED_STATUSES.has(status)) continue;

    const statusText = read(contextFile(dir, "STATUS.md") ?? "") ?? "";
    const blocked = hasBlockers(parseFrontmatter(statusText).body);
    const items = openWorkItems(dir);
    const days = s.daysSinceLastEntry;
    const isActive = !status || status === "active" || status === "in-progress";
    const healthRaw = Number(s.frontmatter.brief.health ?? s.frontmatter.status.health);

    let tier: Candidate["tier"] = "quiet";
    let rank = 0;
    let reason = "Healthy or quiet; nothing pinned or open.";
    if (s.pinnedItem) {
      tier = "pinned";
      rank = 400;
      reason = `Pinned work/CURRENT.md item: ${s.pinnedItem}`;
    } else if (items.length) {
      tier = "open-items";
      rank = 300 + Math.min(items.length, 20);
      reason = `${items.length} work item(s) ready or in progress.`;
    } else if (isActive && days !== null && days >= dormantDays) {
      // Long-dormant projects sink below blockers: a 115-day-old Next Step is not today's work.
      tier = "dormant";
      rank = 1 + Math.max(0, 365 - days) / 10;
      reason = `Active but untouched for ${days} days; likely parked.`;
    } else if (isActive && days !== null && days >= staleDays) {
      tier = "stale";
      rank = 200 + (dormantDays - days);
      reason = `Active but newest STATUS entry is ${days} days old.`;
    } else if (blocked) {
      tier = "blocked";
      rank = 100;
      reason = "STATUS lists open blockers.";
    }
    // Tie-break inside a tier: more recent activity first everywhere.
    if (tier === "pinned" || tier === "open-items") rank += days === null ? 0 : Math.max(0, 30 - Math.min(days, 30)) / 100;

    out.push({
      project: d.name,
      path: dir,
      rank,
      tier,
      reason,
      status,
      health: Number.isFinite(healthRaw) ? healthRaw : null,
      lastEntryDate: s.lastEntryDate,
      daysSinceLastEntry: days,
      pinnedItem: s.pinnedItem,
      openWorkItems: items,
      nextSteps: s.newestEntries[0]?.nextSteps ?? [],
    });
  }
  return out.sort((a, b) => b.rank - a.rank || a.project.localeCompare(b.project));
}

// ---------- health (health-scoring.md) ----------

export const DIMENSIONS = {
  freshness: { label: "Freshness", weight: 0.25 },
  completeness: { label: "Completeness", weight: 0.15 },
  decisionCoverage: { label: "Decision Coverage", weight: 0.15 },
  consistency: { label: "Consistency", weight: 0.2 },
  ticketAlignment: { label: "Ticket Alignment", weight: 0.1 },
  instructionsAlignment: { label: "Instructions Alignment", weight: 0.15 },
} as const;

export type DimensionKey = keyof typeof DIMENSIONS;

export function band(score: number): string {
  if (score >= 90) return "Healthy";
  if (score >= 70) return "Attention";
  if (score >= 50) return "Action required";
  return "Critical";
}

/** Freshness factor 1: days since last STATUS entry. */
export function daysScore(days: number): number {
  if (days <= 3) return 100;
  if (days <= 7) return 80;
  if (days <= 14) return 60;
  if (days <= 30) return 40;
  if (days <= 60) return 20;
  return 0;
}

/** Freshness from its three factors (50 / 30 / 20). */
export function freshness(days: number, staleItems: number, openItems: number, blockersOver14Days: number): number {
  const stale = openItems > 0 ? 100 * (1 - staleItems / openItems) : 100;
  const blockers = Math.max(0, 100 - 20 * blockersOver14Days);
  return Math.round(0.5 * daysScore(days) + 0.3 * stale + 0.2 * blockers);
}

export function composite(scores: Partial<Record<DimensionKey, number>>) {
  const keys = (Object.keys(DIMENSIONS) as DimensionKey[]).filter((k) => typeof scores[k] === "number");
  if (!keys.length) throw new Error("At least one dimension score is required.");
  const active = keys.reduce((s, k) => s + DIMENSIONS[k].weight, 0);
  const total = keys.reduce((s, k) => s + (scores[k] as number) * DIMENSIONS[k].weight, 0) / active;
  const score = Math.round(total);
  const skipped = (Object.keys(DIMENSIONS) as DimensionKey[]).filter((k) => !keys.includes(k)).map((k) => DIMENSIONS[k].label);
  const scoredLine = `${keys.length} of 6 dimensions` + (skipped.length ? `; skipped: ${skipped.join(", ")}` : "");
  return {
    score,
    band: band(score),
    scored: keys.length,
    skipped,
    adjustedWeights: Object.fromEntries(keys.map((k) => [DIMENSIONS[k].label, +(DIMENSIONS[k].weight / active).toFixed(4)])),
    display: `Health ${score}/100 (${band(score)}; ${scoredLine})`,
  };
}

/** The checker's only write: frontmatter `health` and `last-check` on BRIEF (and STATUS if it has frontmatter). */
export function recordHealth(dir: string, score: number, date: string = today()): string[] {
  const written: string[] = [];
  for (const name of ["PROJECT_BRIEF.md", "STATUS.md"]) {
    const p = contextFile(dir, name);
    if (!p) continue;
    const text = read(p);
    if (!text || !/^---\r?\n/.test(text)) continue;
    const next = setFrontmatter(text, { health: String(score), "last-check": date });
    if (next !== text) {
      writeFileSync(p, next, "utf8");
      written.push(p);
    }
  }
  return written;
}

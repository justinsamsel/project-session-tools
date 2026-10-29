// Write side for session-context-updater: STATUS entries, STATUS condense, DECISIONS entries, stale items.
// The model decides what to say; these functions decide where it goes and keep the files in shape.

import { writeFileSync } from "node:fs";
import { contextFile, daysBetween, parseFrontmatter, read, setFrontmatter, statusEntries, subsection, today } from "./context.js";
// statusEntries (any dated ##/### heading) feeds staleness; datedBlocks (## YYYY-MM-DD only) feeds bloat and condense.

const DATED_H2 = /^##\s+\d{4}-\d{2}-\d{2}/m;
const SUBSECTIONS = [
  ["completed", "Completed"],
  ["inProgress", "In Progress"],
  ["blockers", "Blockers"],
  ["nextSteps", "Next Steps"],
] as const;

export const BLOAT_LINES = 120;
export const BLOAT_ENTRIES = 8;
/** capture.md keeps the newest 5-8 entries: start at 6, go down to 5 only when 6 still leaves the file too long. */
export const KEEP_DEFAULT = 6;
export const KEEP_MIN = 5;

export interface StatusInput {
  date?: string;
  label: string;
  currentState?: string;
  phase?: string;
  completed?: string[];
  inProgress?: string[];
  blockers?: string[];
  nextSteps?: string[];
}

export interface Bloat {
  needed: boolean;
  reasons: string[];
  lines: number;
  datedEntries: number;
  /** Entries a condense would fold away (see planKeep), for the model to write one-line outcomes. */
  wouldCondense: { date: string; heading: string }[];
}

// ---------- helpers ----------

function eolOf(text: string): string {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

/** Work in LF, write back in the file's own line ending. */
function load(path: string): { text: string; eol: string } {
  const raw = read(path);
  if (raw === null) throw new Error(`Cannot read ${path}`);
  return { text: raw.replace(/\r\n/g, "\n"), eol: eolOf(raw) };
}

function save(path: string, text: string, eol: string) {
  writeFileSync(path, eol === "\n" ? text : text.replace(/\n/g, eol), "utf8");
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[`*_]/g, "").replace(/\s+/g, " ").trim();
}

function bullets(items: string[] | undefined): string[] {
  return (items ?? []).map((s) => s.trim()).filter(Boolean);
}

function splitFrontmatter(text: string): { fm: string; body: string } {
  const m = /^---\n[\s\S]*?\n---\n?/.exec(text);
  return m ? { fm: m[0], body: text.slice(m[0].length) } : { fm: "", body: text };
}

function requireStatus(dir: string): string {
  const p = contextFile(dir, "STATUS.md");
  if (!p) throw new Error("No STATUS.md in this project. Bootstrap with session-context-updater Entry Point B first.");
  return p;
}

// ---------- STATUS write ----------

/** Replace the Current State section (or lead line). Returns the new body and the text it replaced. */
function setCurrentState(body: string, state: string): { body: string; replaced: string | null } {
  const section = /^(##[ \t]+Current (?:State|phase)[ \t]*\n)([\s\S]*?)(?=^##\s|^---\s*$)/im;
  const s = section.exec(body);
  if (s) return { body: body.replace(section, (_m, head) => `${head}\n${state.trim()}\n\n`), replaced: s[2].trim() };
  const lead = /^\*\*(?:Overall Phase|Current State|Phase):?\*\*.*$/im;
  const l = lead.exec(body);
  if (l) return { body: body.replace(lead, state.trim()), replaced: l[0].trim() };
  const h1 = /^#\s.*\n/m.exec(body);
  const block = `## Current State\n\n${state.trim()}\n\n---\n\n`;
  if (!h1) return { body: block + body, replaced: null };
  const at = h1.index + h1[0].length;
  return { body: body.slice(0, at) + "\n" + block + body.slice(at).replace(/^\n+/, ""), replaced: null };
}

/** Dated H2 blocks (`## YYYY-MM-DD...`), in file order, each running to the next H2. Shared by bloat and condense. */
function datedBlocks(body: string): { date: string; heading: string; text: string }[] {
  return [...body.matchAll(/^##\s+(\d{4}-\d{2}-\d{2}).*\n[\s\S]*?(?=^##\s|$(?![\s\S]))/gm)].map((m) => ({
    date: m[1],
    heading: m[0].split("\n")[0].replace(/^##\s+/, "").trim(),
    text: m[0],
  }));
}

function renderEntry(heading: string, input: StatusInput): string {
  const parts = [`## ${heading}`, ""];
  for (const [key, label] of SUBSECTIONS) {
    const list = bullets(input[key]);
    if (!list.length) continue;
    parts.push(`**${label}:**`, ...list.map((b) => `- ${b}`), "");
  }
  return parts.join("\n");
}

/** Add missing bullets to an existing same-day, same-label entry. Returns the new entry text and how many were added. */
function mergeEntry(entry: string, input: StatusInput): { text: string; added: number } {
  let text = entry.replace(/\s+$/, "");
  const trailer = entry.slice(text.length);
  let added = 0;
  for (const [key, label] of SUBSECTIONS) {
    const fresh = bullets(input[key]).filter((b) => !norm(text).includes(norm(b)));
    if (!fresh.length) continue;
    added += fresh.length;
    const lines = fresh.map((b) => `- ${b}`).join("\n");
    const head = new RegExp(`^\\*\\*${label}:?\\*\\*:?[ \\t]*\\n((?:[ \\t]*[-*].*\\n?)*)`, "im").exec(text);
    if (head) {
      const at = head.index + head[0].length;
      const sep = text.slice(0, at).endsWith("\n") ? "" : "\n";
      text = text.slice(0, at) + sep + lines + "\n" + text.slice(at);
    } else {
      text = text.replace(/\n*(---\s*)?$/, (tail) => `\n\n**${label}:**\n${lines}${tail.includes("---") ? "\n\n---" : ""}`);
    }
  }
  return { text: text.replace(/\n{3,}/g, "\n\n") + trailer, added };
}

/**
 * How many dated entries a condense keeps, and the line count it would leave. Starts at KEEP_DEFAULT and
 * drops toward KEEP_MIN while the file would still be over BLOAT_LINES, so one condense clears the line check
 * whenever folding entries can. Each folded entry becomes one history row; a new history section adds 5 lines.
 */
export function planKeep(statusText: string): { keep: number; linesAfter: number } {
  const body = parseFrontmatter(statusText).body;
  const entries = datedBlocks(body).sort((a, b) => b.date.localeCompare(a.date));
  const lines = statusText.split(/\r?\n/).length;
  const historyCost = /^##\s+Earlier history/im.test(body) ? 0 : 5;
  const after = (keep: number) => {
    const fold = entries.slice(keep);
    if (!fold.length) return lines;
    return lines - fold.reduce((n, e) => n + e.text.split("\n").length - 1, 0) + fold.length + historyCost;
  };
  let keep = KEEP_DEFAULT;
  while (keep > KEEP_MIN && after(keep) > BLOAT_LINES && entries.length > keep - 1) keep--;
  return { keep, linesAfter: after(keep) };
}

export function bloat(statusText: string): Bloat {
  const body = parseFrontmatter(statusText).body;
  const entries = datedBlocks(body).sort((a, b) => b.date.localeCompare(a.date));
  const lines = statusText.split(/\r?\n/).length;
  const headings = entries.map((e) => norm(e.heading));
  const { keep, linesAfter } = planKeep(statusText);
  const reasons: string[] = [];
  if (lines > BLOAT_LINES) reasons.push(`${lines} lines (over ${BLOAT_LINES})`);
  if (entries.length > BLOAT_ENTRIES) reasons.push(`${entries.length} dated entries (over ${BLOAT_ENTRIES})`);
  if (new Set(headings).size < headings.length) reasons.push("a dated heading repeats");
  if (lines > BLOAT_LINES && linesAfter > BLOAT_LINES)
    reasons.push(`folding down to ${keep} entries still leaves ~${linesAfter} lines; long sections need a by-hand trim`);
  return {
    needed: reasons.length > 0,
    reasons,
    lines,
    datedEntries: entries.length,
    wouldCondense: entries.slice(keep).map((e) => ({ date: e.date, heading: e.heading })),
  };
}

export function writeStatus(dir: string, input: StatusInput) {
  const path = requireStatus(dir);
  const { text, eol } = load(path);
  const date = input.date ?? today();
  const heading = `${date}, ${input.label.trim()}`;
  let { fm, body } = splitFrontmatter(text);

  let replacedCurrentState: string | null = null;
  if (input.currentState) ({ body, replaced: replacedCurrentState } = setCurrentState(body, input.currentState));

  // Same day + same label: merge instead of stacking a duplicate block.
  const sameRe = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n[\\s\\S]*?(?=^##\\s|$(?![\\s\\S]))`, "im");
  const same = sameRe.exec(body);
  let action: "inserted" | "merged" | "unchanged";
  let added = 0;
  if (same) {
    const merged = mergeEntry(same[0], input);
    added = merged.added;
    action = added ? "merged" : "unchanged";
    body = body.slice(0, same.index) + merged.text + body.slice(same.index + same[0].length);
  } else {
    const usesRules = /^---\s*$/m.test(body);
    const block = renderEntry(heading, input) + (usesRules ? "\n---\n\n" : "\n");
    const first = DATED_H2.exec(body);
    const earlier = /^##\s+Earlier history/im.exec(body);
    if (first) body = body.slice(0, first.index) + block + body.slice(first.index);
    else if (earlier) body = body.slice(0, earlier.index) + block + body.slice(earlier.index);
    else body = body.replace(/\s*$/, "\n\n") + (usesRules ? "---\n\n" : "") + block;
    action = "inserted";
    added = SUBSECTIONS.reduce((n, [k]) => n + bullets(input[k]).length, 0);
  }

  let out = fm + body;
  if (fm) {
    const updates: Record<string, string> = { "last-updated": date };
    if (input.phase) updates.status = input.phase;
    out = setFrontmatter(out, updates);
  }
  const changed = out !== text;
  if (changed) save(path, out, eol);
  return { path, heading, action: changed ? action : "unchanged", bulletsAdded: added, replacedCurrentState, bloat: bloat(out) };
}

// ---------- STATUS condense ----------

export function condenseStatus(dir: string, outcomes: { date: string; outcome: string }[], keep?: number) {
  const path = requireStatus(dir);
  const { text, eol } = load(path);
  keep ??= planKeep(text).keep;
  let { fm, body } = splitFrontmatter(text);

  const blocks = datedBlocks(body);
  const ordered = [...blocks].sort((a, b) => b.date.localeCompare(a.date));
  const fold = ordered.slice(keep);
  if (!fold.length) return { path, condensed: 0, kept: blocks.length, lines: text.split("\n").length };

  // Outcomes are matched by date, in order, so two folded sessions on one day each get their own line.
  const byDate = new Map<string, string[]>();
  for (const o of outcomes) byDate.set(o.date, [...(byDate.get(o.date) ?? []), o.outcome.trim()]);

  const newRows = fold
    .map((b) => {
      const queue = byDate.get(b.date);
      const outcome = queue?.length ? queue.shift()! : b.heading.replace(/^\d{4}-\d{2}-\d{2}[,:]?\s*/, "") || "(no label)";
      return { date: b.date, line: `| ${b.date} | ${outcome.replace(/\|/g, "\\|").replace(/\n+/g, " ")} |` };
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((r) => r.line);

  // Folded blocks leave a marker where the first one (in file order) sat; the rest are removed.
  const MARK = "\u0000CONDENSED\u0000\n"; // own line, so a heading after it still starts a line
  const foldSet = new Set(fold.map((b) => b.text));
  let first = true;
  for (const b of blocks) {
    if (!foldSet.has(b.text)) continue;
    body = body.replace(b.text, first ? MARK : "");
    first = false;
  }

  // An existing history section is rebuilt in place: new rows go above its old rows, which (with any
  // intro or footer lines, and date ranges like 2026-06-15–16) are kept exactly as written.
  const earlierRe = /^##\s+Earlier history[^\n]*\n[\s\S]*?(?=^##\s|$(?![\s\S]))/im;
  const existing = earlierRe.exec(body);
  let historyRows: number;
  if (existing) {
    const lines = existing[0].split("\n");
    const sep = lines.findIndex((l) => /^\|[\s:|-]+\|\s*$/.test(l));
    if (sep >= 0) lines.splice(sep + 1, 0, ...newRows);
    else lines.splice(1, 0, "", "| Date | Outcome |", "|------|---------|", ...newRows, "");
    historyRows = lines.filter((l, i) => i > Math.max(sep, 0) && /^\|/.test(l)).length;
    body = body.replace(existing[0], lines.join("\n"));
    body = body.replace(MARK, "");
  } else {
    const table = ["## Earlier history (condensed)", "", "| Date | Outcome |", "|------|---------|", ...newRows, "", ""].join("\n");
    historyRows = newRows.length;
    body = body.replace(MARK, table);
  }

  // Tidy runs of separators and blank lines left by the removals.
  body = body.replace(/(\n---[ \t]*\n\s*){2,}/g, "\n---\n\n").replace(/\n{3,}/g, "\n\n");

  const out = fm + body;
  save(path, out, eol);
  return { path, condensed: fold.length, kept: blocks.length - fold.length, historyRows, lines: out.split("\n").length };
}

// ---------- DECISIONS ----------

export interface DecisionInput {
  title: string;
  date?: string;
  context: string;
  decision: string;
  alternatives?: string;
  implications?: string;
  supersedes?: string;
}

export function appendDecision(dir: string, input: DecisionInput) {
  const path = contextFile(dir, "DECISIONS.md");
  if (!path) throw new Error("No DECISIONS.md in this project. Bootstrap with session-context-updater Entry Point B first.");
  const { text, eol } = load(path);
  const date = input.date ?? today();
  const warnings: string[] = [];

  // The skill's entry shape is `### Title, YYYY-MM-DD`. Use the level the file's newest such entry uses,
  // and insert right after that entry's block, so a trailing older-format list or "Earlier history"
  // section stays at the bottom.
  const entries = [...text.matchAll(/^(#{2,3})\s+.+,\s*\d{4}-\d{2}-\d{2}\s*$/gm)];
  const lastEntry = entries[entries.length - 1];
  const level = lastEntry ? lastEntry[1] : "###";
  const title = input.title.trim();
  if (new RegExp(`^#{2,3}\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")},\\s*${date}`, "im").test(text))
    return { path, action: "unchanged", warnings: ["A decision with this title and date already exists."] };

  let out = text;
  if (input.supersedes) {
    const needle = norm(input.supersedes);
    const heads = [...out.matchAll(/^#{2,3}\s+(.*)$/gm)].filter((m) => norm(m[1]).includes(needle));
    if (heads.length === 1) {
      const h = heads[0];
      const after = out.indexOf("\n", h.index!) + 1;
      const marker = `\n**Superseded:** ${date}, see "${title}"\n`;
      if (!out.slice(after, after + 200).includes("**Superseded:**")) out = out.slice(0, after) + marker + out.slice(after);
    } else {
      warnings.push(
        heads.length ? `"${input.supersedes}" matches ${heads.length} headings; superseded marker not added.` : `No heading matches "${input.supersedes}"; superseded marker not added.`,
      );
    }
  }

  const lines = [`${level} ${title}, ${date}`, "", `**Context:** ${input.context.trim()}`, `**Decision:** ${input.decision.trim()}`];
  if (input.alternatives) lines.push(`**Alternatives considered:** ${input.alternatives.trim()}`);
  if (input.implications) lines.push(`**Implications:** ${input.implications.trim()}`);
  const entry = lines.join("\n") + "\n";

  // Re-find the anchor in `out` (a supersession marker may have shifted offsets).
  const anchors = [...out.matchAll(/^(#{2,3})\s+.+,\s*\d{4}-\d{2}-\d{2}\s*$/gm)];
  const anchor = anchors[anchors.length - 1];
  let at = out.length;
  if (anchor) {
    const stop = new RegExp(`^#{1,${anchor[1].length}}\\s`, "gm");
    stop.lastIndex = anchor.index! + anchor[0].length;
    const next = stop.exec(out);
    if (next) at = next.index;
  } else {
    const earlier = /^##\s+Earlier history/im.exec(out);
    if (earlier) at = earlier.index;
  }
  if (at >= out.length) out = out.replace(/\s*$/, "\n\n") + entry;
  else out = out.slice(0, at).replace(/\s*$/, "\n\n") + entry + "\n" + out.slice(at);
  if (/^---\n/.test(out)) out = setFrontmatter(out, { "last-updated": date });

  save(path, out, eol);
  return { path, action: "appended", heading: `${title}, ${date}`, warnings };
}

// ---------- staleness ----------

const STOP = new Set(
  "the and for with from into that this then than once own per each any all are was were has have had not but via its use run get set new add one two out off also just still only when what which after before need needs".split(" "),
);
/** Share of the item's words a later line must contain to count as a follow-up under different wording. */
export const FOLLOW_UP_OVERLAP = 0.6;

function words(s: string): Set<string> {
  return new Set((norm(s).match(/[a-z0-9]+/g) ?? []).filter((w) => (w.length >= 3 || /\d/.test(w)) && !STOP.has(w)));
}

/**
 * True when a later entry repeats the item's first 60 chars anywhere, or a later Completed bullet or heading
 * carries most of its words (a reworded completion) and every word with a digit in it (`Phase 1 #6`, `PR 2-3`),
 * so a line about #5 never closes #6. Short items (under 4 words) need the verbatim match.
 */
function followedUp(item: string, laterText: string, laterLines: Set<string>[]): boolean {
  const key = norm(item).slice(0, 60);
  if (!key || laterText.includes(key)) return true;
  const mine = words(item);
  if (mine.size < 4) return false;
  const ids = [...mine].filter((w) => /\d/.test(w));
  return laterLines.some((line) => {
    if (!ids.every((w) => line.has(w))) return false;
    let hit = 0;
    for (const w of mine) if (line.has(w)) hit++;
    return hit / mine.size >= FOLLOW_UP_OVERLAP;
  });
}

export function staleItems(dir: string, thresholdDays = 14, blockerDays = 7, asOf: string = today()) {
  const path = requireStatus(dir);
  const fm = parseFrontmatter(read(path) ?? "");
  const phase = (fm.data.status ?? "").toLowerCase();
  if (["on-hold", "on hold", "cancelled", "canceled"].includes(phase)) return { path, skipped: `Project is ${phase}.`, items: [] };

  const entries = statusEntries(fm.body);
  const items: { date: string; ageDays: number; kind: string; item: string; from: string }[] = [];
  entries.forEach((e, i) => {
    if (i === 0) return; // newest entry is never stale
    const newer = entries.slice(0, i);
    const later = newer.map((x) => norm(x.text)).join("\n");
    const laterLines = newer.flatMap((x) => [x.heading, ...subsection(x.text, "Completed")]).map(words);
    const age = daysBetween(e.date, asOf);
    const check = (list: string[], kind: string, limit: number) => {
      if (age < limit) return;
      for (const item of list) {
        if (!followedUp(item, later, laterLines)) items.push({ date: e.date, ageDays: age, kind, item, from: e.heading });
      }
    };
    check(e.nextSteps, "Next Steps", thresholdDays);
    check(e.inProgress, "In Progress", thresholdDays);
    check(e.blockers, "Blockers", blockerDays);
  });
  items.sort((a, b) => a.date.localeCompare(b.date));
  return { path, items };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { composite, freshness, parseFrontmatter, portfolio, recordHealth, setFrontmatter, snapshot, statusEntries, waitingProposals } from "../context.js";

const STATUS = `---
type: status
status: active
last-updated: 2026-10-20
health: 70
---

# STATUS

## Current State

Three of five features shipped.

---

## 2026-10-20, Second session

**Completed:**
- Thing B

**Next Steps:**
- Ship feature D
- Write tests

---

## 2026-10-01, First session

**Next Steps:**
- Old step
`;

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "wsmcp-"));
  const a = join(root, "alpha");
  mkdirSync(join(a, "context"), { recursive: true });
  mkdirSync(join(a, "work"));
  writeFileSync(join(a, "context", "STATUS.md"), STATUS);
  writeFileSync(join(a, "context", "PROJECT_BRIEF.md"), "---\ntype: brief\nstatus: active\n---\n\n# Brief\nTicket INC-000412.\n");
  writeFileSync(join(a, "work", "CURRENT.md"), "**Active item:** _(none)_\n");
  writeFileSync(join(a, "work", "x.md"), "---\nstatus: ready\ntitle: Do X\n---\n");

  const b = join(root, "beta");
  mkdirSync(join(b, "context"), { recursive: true });
  writeFileSync(join(b, "context", "STATUS.md"), STATUS.replace("2026-10-20", "2026-01-01").replace("2026-10-20", "2026-01-01"));
  mkdirSync(join(b, "work"));
  writeFileSync(join(b, "work", "CURRENT.md"), "**Active item:** Fix the gate\n");

  const c = join(root, "gamma");
  mkdirSync(join(c, "context"), { recursive: true });
  writeFileSync(join(c, "context", "PROJECT_BRIEF.md"), "---\nstatus: archived\n---\n");
  return root;
}

test("statusEntries sorts newest first and pulls Next Steps", () => {
  const e = statusEntries(parseFrontmatter(STATUS).body);
  assert.equal(e[0].date, "2026-10-20");
  assert.deepEqual(e[0].nextSteps, ["Ship feature D", "Write tests"]);
  assert.equal(e.length, 2);
});

test("snapshot reads state, tickets and pin", () => {
  const root = fixture();
  const s = snapshot(join(root, "alpha"));
  assert.equal(s.currentState, "Three of five features shipped.");
  assert.equal(s.lastEntryDate, "2026-10-20");
  assert.deepEqual(s.ticketIds, ["INC-000412"]);
  assert.equal(s.pinnedItem, null);
  assert.equal(snapshot(join(root, "beta")).pinnedItem, "Fix the gate");
});

function proposal(dir: string, file: string, fm: string): void {
  writeFileSync(join(dir, file), `---\ntype: proposal\n${fm}\n---\n\n## Found\nx\n`);
}

test("waitingProposals matches by ticket id or target path and skips resolved, snoozed, trial and archive", () => {
  const root = mkdtempSync(join(tmpdir(), "wsmcp-prop-"));
  const folder = join(root, "tickets", "INC-100001 - Printer - Pat");
  mkdirSync(join(folder, "context"), { recursive: true });
  const props = join(root, "proposals");
  mkdirSync(join(props, "trial", "run1"), { recursive: true });
  mkdirSync(join(props, "archive"));

  proposal(props, "2026-11-02-by-ticket.md", "title: Reply to Pat\nstatus: pending          # pending | approved\nkind: outward\ncreated: 2026-11-02\nticket: INC-100001");
  proposal(props, "2026-11-01-by-target.md", "title: Update STATUS\nstatus: approved\nkind: vault-edit\ncreated: 2026-11-01\ntarget: \"tickets/INC-100001 - Printer - Pat/context/STATUS.md\"");
  proposal(props, "2026-11-03-done.md", "title: Done one\nstatus: done\ncreated: 2026-11-03\nticket: INC-100001");
  proposal(props, "2026-11-04-snoozed.md", "title: Snoozed\nstatus: pending\ncreated: 2026-11-04\nticket: INC-100001\nsnooze-until: 2999-01-01");
  proposal(props, "2026-11-05-other.md", "title: Other ticket\nstatus: pending\ncreated: 2026-11-05\nticket: INC-100002");
  proposal(join(props, "trial", "run1"), "2026-11-06-trial.md", "title: Trial\nstatus: pending\ncreated: 2026-11-06\nticket: INC-100001");
  proposal(join(props, "archive"), "2026-10-01-old.md", "title: Old\nstatus: pending\ncreated: 2026-10-01\nticket: INC-100001");
  writeFileSync(join(props, "README.md"), "---\ntype: index\n---\n");

  const got = waitingProposals(folder, props);
  assert.deepEqual(got.map((p) => p.file), ["2026-11-01-by-target.md", "2026-11-02-by-ticket.md"]);
  assert.equal(got[1].title, "Reply to Pat");
  assert.equal(got[1].status, "pending");
  assert.equal(got[1].kind, "outward");
  assert.deepEqual(waitingProposals(folder, join(root, "no-such-folder")), []);
  assert.equal(snapshot(folder, 2, props).proposals.length, 2);
  assert.deepEqual(snapshot(folder, 2, null).proposals, []);
});

test("portfolio ranks pinned over open items and skips archived", () => {
  const ranked = portfolio(fixture());
  assert.deepEqual(ranked.map((r) => r.project), ["beta", "alpha"]);
  assert.equal(ranked[0].tier, "pinned");
  assert.deepEqual(ranked[1].openWorkItems, ["Do X"]);
});

test("portfolio ranks recent stale over blocked over long-dormant", () => {
  const root = mkdtempSync(join(tmpdir(), "wsmcp-"));
  const ago = (n: number) => new Date(Date.now() - n * 86400000).toLocaleDateString("en-CA");
  const make = (name: string, days: number, blockers = false) => {
    mkdirSync(join(root, name, "context"), { recursive: true });
    const extra = blockers ? "\n## Blockers\n\n- Waiting on vendor\n" : "";
    writeFileSync(join(root, name, "context", "STATUS.md"), `# STATUS\n\n## Current State\n\nx\n${extra}\n## ${ago(days)}, s\n\n**Next Steps:**\n- y\n`);
  };
  make("recent", 10);
  make("older", 40);
  make("parked", 115);
  make("ancient", 208);
  make("blocked", 2, true);
  const ranked = portfolio(root);
  assert.deepEqual(ranked.map((r) => r.project), ["recent", "older", "blocked", "parked", "ancient"]);
  assert.equal(ranked[3].tier, "dormant");
});

test("primer date uses the local day of an undated file's mtime", () => {
  const root = fixture();
  const dir = join(root, "alpha", "context", "prompts", "next-session");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "latest.md");
  writeFileSync(file, "primer");
  const evening = new Date(2026, 9, 28, 21, 32); // local 21:32, already the 29th in UTC west of GMT
  utimesSync(file, evening, evening);
  assert.equal(snapshot(join(root, "alpha")).primer?.date, "2026-10-28");
});

test("composite redistributes weights for skipped dimensions", () => {
  const r = composite({ freshness: 80, completeness: 80, decisionCoverage: 80, consistency: 80, instructionsAlignment: 80 });
  assert.equal(r.score, 80);
  assert.equal(r.scored, 5);
  assert.deepEqual(r.skipped, ["Ticket Alignment"]);
  const mixed = composite({ freshness: 100, consistency: 0 });
  assert.equal(mixed.score, Math.round((100 * 0.25) / 0.45));
  assert.equal(composite({ freshness: 49 }).band, "Critical");
});

test("freshness follows the 50/30/20 rubric", () => {
  assert.equal(freshness(2, 0, 4, 0), 100);
  assert.equal(freshness(16, 1, 4, 1), Math.round(0.5 * 40 + 0.3 * 75 + 0.2 * 80));
});

test("recordHealth writes only frontmatter", () => {
  const root = fixture();
  const written = recordHealth(join(root, "alpha"), 88, "2026-10-28");
  assert.equal(written.length, 2);
  const text = readFileSync(join(root, "alpha", "context", "STATUS.md"), "utf8");
  assert.match(text, /^health: 88$/m);
  assert.match(text, /^last-check: 2026-10-28$/m);
  assert.equal(parseFrontmatter(text).body, parseFrontmatter(STATUS).body);
  assert.equal(setFrontmatter("no frontmatter", { a: "1" }), "no frontmatter");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendDecision, condenseStatus, staleItems, writeStatus } from "../writer.js";

const STATUS = `---
type: status
status: active
last-updated: 2026-10-01
health: 70
last-check: 2026-09-01
---

# STATUS

## Current State

Old state.

---

## 2026-10-01, First session

**Next Steps:**
- Ship feature D
- Write the README

---
`;

const DECISIONS = `---
type: decisions
last-updated: 2026-10-01
---

# DECISIONS

### Use SQLite, 2026-09-01

**Context:** Needed storage.
**Decision:** SQLite.
`;

function project(status = STATUS, crlf = false): string {
  const dir = mkdtempSync(join(tmpdir(), "wsmcp-w-"));
  mkdirSync(join(dir, "context"));
  const fix = (s: string) => (crlf ? s.replace(/\n/g, "\r\n") : s);
  writeFileSync(join(dir, "context", "STATUS.md"), fix(status));
  writeFileSync(join(dir, "context", "DECISIONS.md"), fix(DECISIONS));
  return dir;
}

const statusOf = (dir: string) => readFileSync(join(dir, "context", "STATUS.md"), "utf8");

test("status_write inserts newest-first, overwrites Current State, keeps health", () => {
  const dir = project();
  const r = writeStatus(dir, { date: "2026-10-28", label: "Second", currentState: "New state.", completed: ["Shipped D"], nextSteps: ["Tag release"] });
  assert.equal(r.action, "inserted");
  assert.equal(r.replacedCurrentState, "Old state.");
  const t = statusOf(dir);
  assert.ok(t.indexOf("## 2026-10-28, Second") < t.indexOf("## 2026-10-01, First session"));
  assert.match(t, /## Current State\n\nNew state\.\n\n---/);
  assert.doesNotMatch(t, /Old state/);
  assert.match(t, /^last-updated: 2026-10-28$/m);
  assert.match(t, /^health: 70$/m);
  assert.match(t, /\*\*Completed:\*\*\n- Shipped D\n\n\*\*Next Steps:\*\*\n- Tag release/);
});

test("status_write merges a same-day same-label entry without duplicates", () => {
  const dir = project();
  writeStatus(dir, { date: "2026-10-28", label: "Second", completed: ["Shipped D"] });
  const r = writeStatus(dir, { date: "2026-10-28", label: "Second", completed: ["Shipped D", "Fixed bug E"], blockers: ["Waiting on vendor"] });
  assert.equal(r.action, "merged");
  assert.equal(r.bulletsAdded, 2);
  const t = statusOf(dir);
  assert.equal(t.match(/## 2026-10-28, Second/g)!.length, 1);
  assert.equal(t.match(/- Shipped D/g)!.length, 1);
  assert.match(t, /- Shipped D\n- Fixed bug E/);
  assert.match(t, /\*\*Blockers:\*\*\n- Waiting on vendor/);
  assert.equal(writeStatus(dir, { date: "2026-10-28", label: "Second", completed: ["Shipped D"] }).action, "unchanged");
});

test("status_write keeps CRLF files CRLF", () => {
  const dir = project(STATUS, true);
  writeStatus(dir, { date: "2026-10-28", label: "Second", completed: ["X"] });
  const t = statusOf(dir);
  assert.ok(!/[^\r]\n/.test(t), "every LF is preceded by CR");
});

test("bloat flags too many entries and condense folds them with given outcomes", () => {
  const dir = project();
  let r;
  for (let d = 2; d <= 10; d++) r = writeStatus(dir, { date: `2026-10-${String(d).padStart(2, "0")}`, label: `S${d}`, completed: [`Did ${d}`] });
  assert.equal(r!.bloat.needed, true);
  assert.equal(r!.bloat.datedEntries, 10);
  assert.deepEqual(r!.bloat.wouldCondense.map((e) => e.date), ["2026-10-04", "2026-10-03", "2026-10-02", "2026-10-01"]);

  const c = condenseStatus(dir, [{ date: "2026-10-01", outcome: "Kicked off | planned D" }]);
  assert.equal(c.condensed, 4);
  const t = statusOf(dir);
  assert.equal((t.match(/^## 2026-/gm) ?? []).length, 6);
  assert.match(t, /## Earlier history \(condensed\)\n\n\| Date \| Outcome \|\n\|------\|---------\|\n\| 2026-10-04 \| S4 \|/);
  assert.match(t, /\| 2026-10-01 \| Kicked off \\\| planned D \|/);
  assert.match(t, /## Current State/);

  // A second condense keeps the old rows.
  for (let d = 11; d <= 12; d++) writeStatus(dir, { date: `2026-10-${d}`, label: `S${d}`, completed: [`Did ${d}`] });
  condenseStatus(dir, []);
  const t2 = statusOf(dir);
  assert.equal(t2.match(/## Earlier history/g)!.length, 1);
  assert.match(t2, /\| 2026-10-06 \| S6 \|[\s\S]*\| 2026-10-01 \| Kicked off/);
});

test("condense keeps an existing history section in place, with range rows and footer", () => {
  const status = `# STATUS

## Current State

Now.

---

${Array.from({ length: 8 }, (_, i) => `## 2026-10-${String(20 - i).padStart(2, "0")}, S${20 - i}\n\n**Completed:**\n- x${i}\n\n---\n`).join("\n")}
## Earlier history (condensed)

| When | Outcome |
|------|---------|
| 2026-06-15–16 | Token audit |

Detail: notes/.

---

## Standing practice

- Rule one
`;
  const dir = project(status);
  const c = condenseStatus(dir, [{ date: "2026-10-13", outcome: "Thirteen" }]);
  assert.equal(c.condensed, 2);
  const t = statusOf(dir);
  assert.match(t, /\| When \| Outcome \|\n\|------\|---------\|\n\| 2026-10-14 \| S14 \|\n\| 2026-10-13 \| Thirteen \|\n\| 2026-06-15–16 \| Token audit \|\n\nDetail: notes\/\./);
  assert.ok(t.indexOf("## Earlier history") < t.indexOf("## Standing practice"));
  assert.equal((t.match(/^## 2026-/gm) ?? []).length, 6);
  assert.doesNotMatch(t, /\n{3,}/);
});

test("decision_append inserts after the newest Title, date entry, before an older-format tail", () => {
  const dir = project();
  writeFileSync(
    join(dir, "context", "DECISIONS.md"),
    "# DECISIONS\n\n### Newer one, 2026-10-01\n\n**Decision:** a\n\n## 2026-07-01 – Old style\n\nold\n\n## Earlier history (condensed)\n\n| x | y |\n",
  );
  appendDecision(dir, { title: "Newest", date: "2026-10-28", context: "c", decision: "d" });
  const t = readFileSync(join(dir, "context", "DECISIONS.md"), "utf8");
  assert.ok(t.indexOf("### Newest, 2026-10-28") > t.indexOf("### Newer one"));
  assert.ok(t.indexOf("### Newest, 2026-10-28") < t.indexOf("## 2026-07-01 – Old style"));
  assert.match(t, /\| x \| y \|\n$/);
});

test("decision_append matches heading level, marks supersession, refuses duplicates", () => {
  const dir = project();
  const r = appendDecision(dir, { title: "Use Postgres", date: "2026-10-28", context: "Scale.", decision: "Postgres.", supersedes: "Use SQLite" });
  assert.equal(r.action, "appended");
  assert.deepEqual(r.warnings, []);
  const t = readFileSync(join(dir, "context", "DECISIONS.md"), "utf8");
  assert.match(t, /### Use SQLite, 2026-09-01\n\n\*\*Superseded:\*\* 2026-10-28, see "Use Postgres"/);
  assert.match(t, /### Use Postgres, 2026-10-28\n\n\*\*Context:\*\* Scale\.\n\*\*Decision:\*\* Postgres\.\n$/);
  assert.match(t, /^last-updated: 2026-10-28$/m);
  assert.equal(appendDecision(dir, { title: "Use Postgres", date: "2026-10-28", context: "x", decision: "y" }).action, "unchanged");
});

test("stale_items finds old Next Steps not followed up", () => {
  const dir = project();
  writeStatus(dir, { date: "2026-10-20", label: "Later", completed: ["Ship feature D done"], nextSteps: ["New thing"] });
  const r = staleItems(dir, 14, 7, "2026-10-28");
  assert.deepEqual(r.items.map((i) => i.item), ["Write the README"]);
  assert.equal(r.items[0].ageDays, 27);
});

test("stale_items counts a reworded follow-up as done, but not a loosely related line", () => {
  const dir = project();
  writeStatus(dir, {
    date: "2026-10-02",
    label: "Plan",
    nextSteps: [
      "Run project-builder Entry Point A then C on a scratch project (own `git init`), once per domain.",
      "Rotate the Graph API client secret",
      "**Phase 1 #6** TOTP 2FA on admin login.",
    ],
  });
  writeStatus(dir, {
    date: "2026-10-23",
    label: "Builder A then C",
    completed: [
      "`project-builder` Entry Point A then C on a software dummy (`scratch-todo-cli`, own git: CLI add/list, Vitest 7/7).",
      "Checked the Graph API docs",
      "Phase 1 #5 shipped; removed the old TOTP 2FA banner from admin login.",
    ],
  });
  writeStatus(dir, { date: "2026-10-27", label: "Latest", completed: ["Other"] });
  const items = staleItems(dir, 14, 7, "2026-10-28").items.map((i) => i.item);
  assert.ok(!items.some((i) => i.startsWith("Run project-builder")), "reworded completion is a follow-up");
  assert.ok(items.includes("Rotate the Graph API client secret"), "two shared words are not a follow-up");
  assert.ok(items.includes("**Phase 1 #6** TOTP 2FA on admin login."), "a line about #5 does not close #6");
});

test("condense keeps 5 entries when 6 would still leave STATUS over 120 lines", () => {
  const long = (d: number) => `## 2026-10-${String(d).padStart(2, "0")}, S${d}\n\n**Completed:**\n${Array.from({ length: 16 }, (_, j) => `- item ${d}.${j}`).join("\n")}\n\n---\n`;
  const status = `# STATUS\n\n## Current State\n\nNow.\n\n---\n\n${[20, 19, 18, 17, 16, 15, 14].map(long).join("\n")}`;
  const dir = project(status);
  const r = writeStatus(dir, { date: "2026-10-21", label: "S21", completed: ["x"] });
  assert.equal(r.bloat.needed, true);
  assert.deepEqual(r.bloat.wouldCondense.map((e) => e.date), ["2026-10-16", "2026-10-15", "2026-10-14"]);
  const c = condenseStatus(dir, []);
  assert.equal(c.condensed, 3);
  assert.equal(c.kept, 5);
  assert.ok(c.lines <= 120, `${c.lines} lines after condense`);
});

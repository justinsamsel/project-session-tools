import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectTickets, loadTicketFiles, sanitize, scaffold, stripHtml, triage } from "../tickets.js";

const T = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  subject: `Ticket ${id}`,
  type: "Incident",
  status: 2,
  priority: 2,
  created_at: "2026-10-01T10:00:00Z",
  due_by: null,
  description: "<p>big html</p>",
  description_text: "big text",
  ...extra,
});

function root(): string {
  const r = mkdtempSync(join(tmpdir(), "wsmcp-t-"));
  mkdirSync(join(r, "INC-100 - Old one - Pat"));
  mkdirSync(join(r, "INC-300 - Done one - Sam", "context"), { recursive: true });
  writeFileSync(join(r, "INC-300 - Done one - Sam", "context", "PROJECT_BRIEF.md"), "---\nproject: Done One\nstatus: active\n---\n");
  mkdirSync(join(r, "Skill Loop Workshop"));
  return r;
}

test("collectTickets reads any shape, dedupes, and drops descriptions", () => {
  const wrapped = [{ type: "text", text: JSON.stringify({ tickets: [T(1), T(2)] }) }];
  const m = collectTickets([wrapped, { tickets: [T(2, { subject: "dup" })] }, JSON.stringify([T(3)])]);
  assert.deepEqual([...m.keys()].sort(), [1, 2, 3]);
  assert.equal(m.get(2)!.subject, "dup");
  assert.ok(!("description" in m.get(1)!) && !("description_text" in m.get(1)!));
});

test("loadTicketFiles reads saved result files and reports unreadable ones", () => {
  const r = root();
  const f = join(r, "page1.json");
  writeFileSync(f, JSON.stringify({ tickets: [T(5)] }));
  const { tickets, unreadable } = loadTicketFiles([f, join(r, "missing.json")]);
  assert.deepEqual([...tickets.keys()], [5]);
  assert.equal(unreadable.length, 1);
});

test("triage matches by number, flags overdue and upcoming, lists archive checks", () => {
  const r = root();
  const tickets = [...collectTickets([T(100), T(200, { due_by: "2026-10-20T00:00:00Z" }), T(201, { due_by: "2026-10-31T00:00:00Z", type: "Service Request" }), T(202, { type: "Odd" })]).values()];
  const rep = triage(tickets, r, "2026-10-28");
  assert.deepEqual(rep.counts, { total: 4, matched: 1, needFolders: 3, unknownType: 1 });
  assert.equal(rep.matched[0].folder, "INC-100 - Old one - Pat");
  assert.deepEqual(rep.overdue.map((x) => x.ticket), ["INC-200"]);
  assert.deepEqual(rep.upcoming.map((x) => x.ticket), ["SR-201"]);
  assert.equal(rep.upcoming[0].dueInDays, 3);
  assert.deepEqual(rep.archiveCheck.map((a) => [a.number, a.project]), [["300", "Done One"]]);
  assert.equal(rep.matched[0].ageDays, 27);
});

test("scaffold writes both files with a safe name and skips existing folders", () => {
  const r = root();
  const res = scaffold(r, {
    id: 400,
    type: "Service Request",
    subject: 'New laptop: "fast" one?. ',
    requesterName: "Assistant Ann",
    requestedForName: "Sam Chen",
    priority: 3,
    status: 2,
    createdAt: "2026-10-27T09:00:00Z",
    description: "<p>Need a laptop&nbsp;&amp; dock</p><ul><li>16GB</li></ul>",
  });
  assert.equal(res.action, "created");
  assert.equal(res.folder, "SR-400 - New laptop fast one - Sam Chen");
  const ticket = readFileSync(join(r, res.folder!, "TICKET.md"), "utf8");
  assert.match(ticket, /\| Priority \| High \|/);
  assert.match(ticket, /\| Requested For \| Sam Chen \|/);
  assert.match(ticket, /\| Created \| 2026-10-27 \|/);
  assert.match(ticket, /Need a laptop & dock\n- 16GB/);
  assert.match(readFileSync(join(r, res.folder!, "CLAUDE.md"), "utf8"), /ticket SR-400\.[\s\S]*## Scope/);
  assert.equal(scaffold(r, { id: 100, type: "Incident", subject: "x", requesterName: "y" }).action, "skipped");
  assert.throws(() => scaffold(r, { id: 500, type: "Weird", subject: "x", requesterName: "y" }), /Unrecognized ticket type/);
  assert.equal(readdirSync(r).filter((d) => d.startsWith("INC-500")).length, 0);
});

test("sanitize and stripHtml edge cases", () => {
  assert.equal(sanitize("a\\b/c:d*e?f\"g<h>i|j. . "), "a b c d e f g h i j");
  assert.equal(stripHtml("x<br/>y&#39;s"), "x\ny's");
});

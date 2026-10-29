// Smoke test: start the built server over stdio and call each read-only tool against the live projects root.
// Usage: node scripts/smoke.mjs [project]
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const project = process.argv[2] ?? "example-project";
const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: ["dist/index.js"] }));

const { tools } = await client.listTools();
console.log("tools:", tools.map((t) => t.name).join(", "));
const { prompts } = await client.listPrompts();
console.log("prompts:", prompts.map((p) => p.name).join(", "));

for (const [name, args] of [
  ["project_snapshot", { project }],
  ["portfolio_rank", { top: 5 }],
  ["health_score", { freshnessInputs: { daysSinceLastEntry: 5, staleItems: 0, openItems: 2, blockersOver14Days: 0 }, completeness: 90, consistency: 95 }],
]) {
  const r = await client.callTool({ name, arguments: args });
  const text = r.content[0].text;
  console.log(`\n=== ${name} (${text.length} chars)${r.isError ? " ERROR" : ""}\n${text.slice(0, 1800)}`);
}
await client.close();

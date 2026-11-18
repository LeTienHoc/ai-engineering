import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../tools/lib/frontmatter.ts";
import { checkAgentProposalOnly } from "../tools/lib/verifycheck.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const agentPath = join(root, "agents", "output-critic.md");

test("output-critic ships in the plugin and only there", () => {
  assert.ok(existsSync(agentPath), "agents/output-critic.md is missing");
  assert.ok(!existsSync(join(root, ".claude", "agents", "output-critic.md")), "old copy in .claude/agents must be gone");
});

test("output-critic stays read-only and self-contained", () => {
  const text = readFileSync(agentPath, "utf8");
  const tools = parseFrontmatter(text)?.data.tools;
  assert.equal(Array.isArray(tools) ? tools.join(", ") : tools, "Read, Grep, Glob");
  assert.equal(checkAgentProposalOnly(text).ok, true);
  assert.doesNotMatch(text, /\.claude\/agent-kit/, "body must not depend on a project path to its rules");
  for (const id of ["OC-001", "OC-002", "OC-003", "OC-004", "OC-005", "OC-006"]) assert.ok(text.includes(id), `body must state ${id}`);
});

test("output-critic rules keep 6 approved rules", () => {
  const rules = readFileSync(join(root, "agent-kit", "output-critic", "rules.md"), "utf8");
  assert.equal((rules.match(/^### OC-\d{3}/gm) ?? []).length, 6);
  assert.equal((rules.match(/^Status: approved$/gm) ?? []).length, 6);
});

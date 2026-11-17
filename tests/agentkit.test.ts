import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const validate = fileURLToPath(new URL("../tools/validate.ts", import.meta.url));

function project(files: Record<string, string>, args: string[] = []): { status: number | null; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "agentkit-"));
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  const r = spawnSync(process.execPath, [validate, ...args], { env: { ...process.env, VALIDATE_ROOT: dir }, encoding: "utf8" });
  return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

const SECTIONS = ["Role", "Scope", "Ask When Missing", "Approval Required", "Output Format"];
const agentFile = (name: string, extra = 0) =>
  `---\nname: ${name}\ndescription: "Advises on ${name}."\ntools: Read, Grep, Glob\nmodel: haiku\n---\n` +
  SECTIONS.map((s) => `## ${s}\ntext`).join("\n") +
  "\n" +
  Array.from({ length: extra }, () => "x").join("\n") +
  "\n";
const rulesFile = (prefix: string, cases: string[]) =>
  `# rules\n\n### ${prefix}-001 Rule\nDo the thing.\nSource: the owner's brief\nEval: ${cases.join(", ")}\nStatus: draft\n`;
const caseFile = (id: string, type: string, rule: string) =>
  `---\nid: ${id}\ntype: ${type}\nrules: [${rule}]\n---\n\n## Input\nx\n\n## Expected\nx\n\n## Fail If\nx\n`;

/** A complete valid kit for agent `name`; case ids get `idPrefix` so two agents can differ. */
function agentFiles(name: string, idPrefix = name, rulePrefix = "AA"): Record<string, string> {
  const ids = ["ok", "ask", "scope"].map((s) => `${idPrefix}-${s}`);
  const kit = `.claude/agent-kit/${name}`;
  return {
    [`.claude/agents/${name}.md`]: agentFile(name),
    [`${kit}/rules.md`]: rulesFile(rulePrefix, ids),
    [`${kit}/cases/${ids[0]}.md`]: caseFile(ids[0], "success", `${rulePrefix}-001`),
    [`${kit}/cases/${ids[1]}.md`]: caseFile(ids[1], "failure", `${rulePrefix}-001`),
    [`${kit}/cases/${ids[2]}.md`]: caseFile(ids[2], "edge", `${rulePrefix}-001`),
  };
}

test("a valid agent with its kit passes", () => {
  const r = project(agentFiles("opt"));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /validate: OK/);
});

test("agent body over 120 lines is BODY_TOO_LONG and names the file", () => {
  const files = agentFiles("opt");
  files[".claude/agents/opt.md"] = agentFile("opt", 125);
  const r = project(files);
  assert.equal(r.status, 1);
  assert.match(r.out, /\.claude[\\/]agents[\\/]opt\.md: \[BODY_TOO_LONG\]/);
});

test("agent without kit rules is NO_KIT_RULES", () => {
  const files = agentFiles("opt");
  delete files[".claude/agent-kit/opt/rules.md"];
  assert.match(project(files).out, /NO_KIT_RULES/);
});

test("kit with 2 cases is TOO_FEW_CASES", () => {
  const files = agentFiles("opt");
  delete files[".claude/agent-kit/opt/cases/opt-scope.md"];
  files[".claude/agent-kit/opt/rules.md"] = rulesFile("AA", ["opt-ok", "opt-ask"]);
  assert.match(project(files).out, /TOO_FEW_CASES/);
});

test("kit folder without an agent file is KIT_WITHOUT_AGENT", () => {
  const files = { ...agentFiles("opt"), ...Object.fromEntries(Object.entries(agentFiles("ghost")).filter(([k]) => k.includes("agent-kit"))) };
  const r = project(files);
  assert.equal(r.status, 1);
  assert.match(r.out, /KIT_WITHOUT_AGENT/);
});

test("non-.md files in .claude/agents are ignored", () => {
  const r = project({ ...agentFiles("opt"), ".claude/agents/notes.txt": "scratch" });
  assert.equal(r.status, 0, r.out);
});

test("two agents sharing a case id is DUPLICATE_ID", () => {
  const r = project({ ...agentFiles("one", "same", "AA"), ...agentFiles("two", "same", "BB") });
  assert.equal(r.status, 1);
  assert.match(r.out, /DUPLICATE_ID/);
});

test("the same case ids in two separate projects are both fine", () => {
  assert.equal(project(agentFiles("one", "same")).status, 0);
  assert.equal(project(agentFiles("two", "same")).status, 0);
});

test("a rule pointing at a missing case is UNKNOWN_EVAL, an unreferenced case is ORPHAN_CASE", () => {
  const files = agentFiles("opt");
  files[".claude/agent-kit/opt/rules.md"] = rulesFile("AA", ["opt-ok", "opt-ask", "opt-nowhere"]);
  const r1 = project(files);
  assert.match(r1.out, /UNKNOWN_EVAL/);
  files[".claude/agent-kit/opt/rules.md"] = rulesFile("AA", ["opt-ok", "opt-ask"]);
  assert.match(project(files).out, /ORPHAN_CASE/);
});

test("a project without .claude/agents is validated as before", () => {
  const r = project({ "README.md": "hello" });
  assert.equal(r.status, 0, r.out);
});

const strip = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([k, v]) => [k.replace(/^\.claude\//, ""), v]));

test("--agents ignores unrelated failures in the target project", () => {
  const files = {
    ...agentFiles("opt"),
    "evaluation/cases/broken.md": "no frontmatter",
    "skills/x/SKILL.md": "---\nname: x\n---\n",
  };
  assert.equal(project(files).status, 1, "full mode still reports the unrelated issues");
  const r = project(files, ["--agents"]);
  assert.equal(r.status, 0, r.out);
});

test("--agents still scans the agent files for secrets", () => {
  const files = agentFiles("opt");
  files[".claude/agents/opt.md"] += "key AKIA" + "ABCDEFGHIJKLMNOP\n";
  const r = project(files, ["--agents"]);
  assert.equal(r.status, 1);
  assert.match(r.out, /opt\.md/);
});

test("--agents accepts a ~/.claude style root (agents/ at the top)", () => {
  assert.equal(project(strip(agentFiles("opt")), ["--agents"]).status, 0);
  const bad = strip(agentFiles("opt"));
  bad["agents/opt.md"] = agentFile("opt", 125);
  assert.match(project(bad, ["--agents"]).out, /BODY_TOO_LONG/);
});

test("--agents with no agent found fails instead of a false OK", () => {
  const r = project({ "README.md": "hello" }, ["--agents"]);
  assert.equal(r.status, 1);
  assert.match(r.out, /NO_AGENTS/);
});

test("an agent file in a subfolder of .claude/agents is reported, not skipped", () => {
  const r = project({ ...agentFiles("opt"), ".claude/agents/team/foo.md": agentFile("foo") });
  assert.equal(r.status, 1);
  assert.match(r.out, /NESTED_AGENT/);
});

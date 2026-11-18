import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkAgentProposalOnly, checkScript } from "../tools/lib/verifycheck.ts";

const agent = (toolsLine: string | null) =>
  `---\nname: w\ndescription: "worker"\n${toolsLine === null ? "" : toolsLine + "\n"}model: haiku\n---\n\nbody\n`;
const pkg = (scripts: Record<string, string>) => JSON.stringify({ scripts });

test("agent with read-only tools is proposal-only", () => {
  assert.equal(checkAgentProposalOnly(agent("tools: Read, Grep, Glob")).ok, true);
});

test("agent with Write is not proposal-only and the reason names it", () => {
  const r = checkAgentProposalOnly(agent("tools: Read, Write"));
  assert.equal(r.ok, false);
  assert.match(r.reason, /Write/);
});

test("agent without a tools line is not proposal-only", () => {
  const r = checkAgentProposalOnly(agent(null));
  assert.equal(r.ok, false);
  assert.match(r.reason, /no tools/);
});

test("YAML list tools are parsed", () => {
  const r = checkAgentProposalOnly(agent("tools: [Read, Bash]"));
  assert.equal(r.ok, false);
  assert.match(r.reason, /Bash/);
});

test("tool names are matched case-insensitively", () => {
  assert.equal(checkAgentProposalOnly(agent("tools: read, grep")).ok, true);
  assert.equal(checkAgentProposalOnly(agent("tools: read, edit")).ok, false);
});

test("a worker may not spawn agents", () => {
  const r = checkAgentProposalOnly(agent("tools: Read, Grep, Agent"));
  assert.equal(r.ok, false);
  assert.match(r.reason, /Agent/);
});

test("CRLF agent file gives the same result as LF", () => {
  const lf = agent("tools: Read, Write");
  assert.deepEqual(checkAgentProposalOnly(lf.replace(/\n/g, "\r\n")), checkAgentProposalOnly(lf));
});

test("a plain test script is check-only", () => {
  const r = checkScript(pkg({ test: "vitest run" }), "test");
  assert.equal(r.ok, true);
  assert.deepEqual(r.checked, ["test"]);
});

test("--fix and -u are blocked", () => {
  const fix = checkScript(pkg({ lint: "eslint . --fix" }), "lint");
  assert.equal(fix.ok, false);
  assert.match(fix.reason, /--fix/);
  assert.equal(checkScript(pkg({ test: "jest -u" }), "test").ok, false);
});

test("pre hooks are checked", () => {
  const r = checkScript(pkg({ pretest: "rimraf dist", test: "jest" }), "test");
  assert.equal(r.ok, false);
  assert.ok(r.checked.includes("pretest"));
});

test("nested npm run scripts are checked", () => {
  const r = checkScript(pkg({ check: "npm run lint && npm run test", lint: "eslint --fix .", test: "jest" }), "check");
  assert.equal(r.ok, false);
  assert.match(r.reason, /lint/);
});

test("script cycles terminate", () => {
  const r = checkScript(pkg({ a: "npm run b", b: "npm run a" }), "a");
  assert.equal(r.ok, true);
});

test("write commands in many forms are blocked", () => {
  for (const body of ["cross-env CI=1 eslint --fix", "del /q out", "rd /s x", "prisma migrate dev", "npm install", "git push", "tsc > out.txt"]) {
    assert.equal(checkScript(pkg({ x: body }), "x").ok, false, body);
  }
});

test("missing script and invalid package.json are blocked with a reason", () => {
  const missing = checkScript(pkg({ test: "jest" }), "lint");
  assert.equal(missing.ok, false);
  assert.match(missing.reason, /not found/);
  const bad = checkScript("{ not json", "test");
  assert.equal(bad.ok, false);
  assert.match(bad.reason, /package\.json/);
});

const tool = (name: string) => fileURLToPath(new URL(`../tools/${name}`, import.meta.url));
const run = (name: string, args: string[]) => spawnSync(process.execPath, [tool(name), ...args], { encoding: "utf8" });

test("check-script CLI prints OK or BLOCKED with exit 0 or 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "vc-"));
  const file = join(dir, "package.json");
  writeFileSync(file, pkg({ test: "jest", lint: "eslint --fix ." }));
  const ok = run("check-script.ts", [file, "test"]);
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /^OK:/);
  const blocked = run("check-script.ts", [file, "lint"]);
  assert.equal(blocked.status, 1);
  assert.match(blocked.stdout, /^BLOCKED:/);
});

test("check-agent CLI without arguments is a usage error", () => {
  assert.equal(run("check-agent.ts", []).status, 2);
});

// Final review fixes
test("only known read-only tools pass; anything else is an unknown tool", () => {
  for (const line of ["tools: Read, Bash(git:*)", "tools: Read, Agent(worker)", "tools: Read, Task", "tools: Read, MultiEdit", "tools: Read, mcp__x__write_file", "tools: '*'", "tools: Read Edit"]) {
    const r = checkAgentProposalOnly(agent(line));
    assert.equal(r.ok, false, line);
  }
  assert.equal(checkAgentProposalOnly(agent("tools: Read, Grep, Glob, WebFetch, WebSearch, TodoWrite")).ok, true);
  assert.match(checkAgentProposalOnly(agent("tools: Read, MultiEdit")).reason, /MultiEdit/);
});

test("YAML block list tools are parsed like the comma form", () => {
  const block = "---\nname: w\ndescription: \"worker\"\ntools:\n  - Read\n  - Grep\nmodel: haiku\n---\n\nbody\n";
  assert.equal(checkAgentProposalOnly(block).ok, true);
  assert.equal(checkAgentProposalOnly(block.replace("  - Grep", "  - Write")).ok, false);
});

test("hitting the nesting limit is not OK", () => {
  const s: Record<string, string> = {};
  for (let i = 0; i < 6; i++) s[`s${i}`] = `npm run s${i + 1}`;
  s.s6 = "echo deep";
  const r = checkScript(pkg(s), "s0");
  assert.equal(r.ok, false);
  assert.match(r.reason, /deeper/);
});

test("npm shortcuts, flags and script runners are followed", () => {
  const bad = { lint: "eslint --fix .", test: "jest -u", start: "rimraf dist" };
  for (const body of ["npm test", "npm t", "npm start", "npm run -s lint", "npm run --silent lint", "run-s lint", "npm-run-all lint", "run-p lint:*", "concurrently \"npm:lint\"", "concurrently \"npm run lint\""]) {
    const scripts: Record<string, string> = { ...bad, "lint:js": "eslint --fix .", x: body };
    assert.equal(checkScript(pkg(scripts), "x").ok, false, body);
  }
});

test("a package-manager call that cannot be resolved is blocked", () => {
  const r = checkScript(pkg({ x: "pnpm --filter web lint", lint: "eslint ." }), "x");
  assert.equal(r.ok, false);
  assert.match(r.reason, /resolve/);
});

test("more write commands are blocked", () => {
  for (const body of ["prettier --write .", "prettier -w .", "biome check --write", "biome check --apply", "vitest run --update", "jest --updateSnapshot=true", "playwright test --update-snapshots", "git checkout .", "git reset --hard", "git clean -fdx", "git commit -m x", "git stash", "sed -i s/a/b/ f", "cp a b", "mv a b", "tee out", "touch f", "mkdir d", "node scripts/gen.js", "npx playwright install"]) {
    assert.equal(checkScript(pkg({ x: body }), "x").ok, false, body);
  }
});

test("tsc without --noEmit is flagged as build output, with --noEmit it is a plain check", () => {
  const emit = checkScript(pkg({ x: "tsc -b" }), "x");
  assert.equal(emit.ok, true);
  assert.equal(emit.buildOutput, true);
  const check = checkScript(pkg({ x: "tsc --noEmit" }), "x");
  assert.equal(check.ok, true);
  assert.equal(check.buildOutput, false);
});

test("OK wording does not overclaim", () => {
  assert.match(checkScript(pkg({ test: "vitest run" }), "test").reason, /no known write pattern/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p: string) => readFileSync(join(root, p), "utf8");

test("real repo passes validation", () => {
  const env = { ...process.env };
  delete env.VALIDATE_ROOT;
  const r = spawnSync(process.execPath, [join(root, "tools", "validate.ts")], { env, encoding: "utf8" });
  assert.equal(r.status, 0, (r.stdout ?? "") + (r.stderr ?? ""));
});

test("every skill folder has SKILL.md and references/rules.md", () => {
  const skillsDir = join(root, "skills");
  const dirs = readdirSync(skillsDir).filter((n) => statSync(join(skillsDir, n)).isDirectory());
  assert.ok(dirs.length >= 2, "expected at least frontend-architect and tutor");
  for (const d of dirs) {
    assert.ok(existsSync(join(skillsDir, d, "SKILL.md")), `skills/${d}/SKILL.md is missing`);
    assert.ok(existsSync(join(skillsDir, d, "references", "rules.md")), `skills/${d}/references/rules.md is missing`);
  }
});

test("plugin.json version equals package.json version", () => {
  const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
  const pkg = JSON.parse(read("package.json"));
  assert.equal(plugin.version, pkg.version);
});

test("tutor never pre-approves tools and stays chat-only", () => {
  const text = read("skills/tutor/SKILL.md");
  assert.doesNotMatch(text, /^allowed-tools:/m, "tutor must not set allowed-tools (it would bypass approval)");
  const line = /^disallowed-tools:(.*)$/m.exec(text)?.[1] ?? "";
  for (const tool of ["Write", "Edit", "NotebookEdit", "Bash", "PowerShell", "Agent", "Glob", "Grep"]) {
    assert.match(line, new RegExp(`\\b${tool}\\b`), `disallowed-tools must list ${tool}`);
  }
});

test("tutor description targets learning topics and excludes the owner's own code", () => {
  const description = /^description:\s*"(.*)"\s*$/m.exec(read("skills/tutor/SKILL.md"))?.[1] ?? "";
  assert.match(description, /concept or topic/i);
  assert.match(description, /not for explaining the owner's own code/i);
});

test("tutor teaches a beginner in plain words by default", () => {
  const text = read("skills/tutor/SKILL.md");
  assert.match(text, /level is not stated.*beginner|beginner.*level is not stated/is);
  assert.match(text, /at most 2 new terms/i);
  assert.match(text, /plain words/i);
  assert.match(text, /name the technical term only after/i);
  const rules = read("skills/tutor/references/rules.md");
  assert.match(rules, /beginner-plain-language/);
});

test("tutor skill states every limit that applies even after approval", () => {
  const text = read("skills/tutor/SKILL.md");
  for (const phrase of ["never send private data", "never download or run files", "never log in", "never install packages"]) {
    assert.ok(text.toLowerCase().includes(phrase), `SKILL.md must say: ${phrase}`);
  }
  assert.match(text, /new topic.*new approval/is);
});

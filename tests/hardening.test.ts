import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, headings } from "../tools/lib/frontmatter.ts";
import { validateSkill } from "../tools/lib/skill.ts";
import { validateEvalCase } from "../tools/lib/evalcase.ts";
import { checkCases, checkTraceability, findUnparsedRuleHeadings, parseRules } from "../tools/lib/rules.ts";
import { scanSecrets } from "../tools/lib/secrets.ts";

// Fixtures contain a § marker that is removed at runtime, so this file never holds a contiguous fake secret.
const fake = (s: string) => s.replace(/§/g, "");

const SECTIONS = ["Role", "Objective", "Inputs", "Outputs", "Constraints", "Workflow", "Ask When Missing", "Approval Required", "Verify", "Report"];
const body = SECTIONS.map((s) => `## ${s}\ntext\n`).join("\n");
const validSkill = `---\nname: demo\ndescription: A demo skill\n---\n${body}`;

// --- frontmatter -----------------------------------------------------------
test("UTF-8 BOM before frontmatter is tolerated", () => {
  assert.deepEqual(validateSkill("﻿" + validSkill), []);
  assert.deepEqual(validateSkill("﻿" + validSkill.replace(/\n/g, "\r\n")), []);
});

test("matching quotes around values are stripped", () => {
  assert.equal(parseFrontmatter('---\ntype: "success"\n---\n')?.data.type, "success");
});

test("bracket lists parse into clean arrays", () => {
  assert.deepEqual(parseFrontmatter("---\nrules: [FE-001, FE-002]\n---\n")?.data.rules, ["FE-001", "FE-002"]);
});

test("block scalars and unquoted ': ' values return UNSUPPORTED_YAML", () => {
  const block = `---\nname: demo\ndescription: >\n  long text\n---\n${body}`;
  assert.ok(validateSkill(block).some((i) => i.code === "UNSUPPORTED_YAML"));
  const colon = `---\nname: demo\ndescription: Use when: something\n---\n${body}`;
  assert.ok(validateSkill(colon).some((i) => i.code === "UNSUPPORTED_YAML"));
  const quoted = `---\nname: demo\ndescription: "Use when: something"\n---\n${body}`;
  assert.deepEqual(validateSkill(quoted), []);
});

test("eval case with a quoted type is accepted", () => {
  const text = `---\nid: a\ntype: "success"\nrules: [FE-001]\n---\n## Input\nx\n## Expected\nx\n## Fail If\nx\n`;
  assert.deepEqual(validateEvalCase(text), []);
});

test("headings ignore fenced code blocks and tolerate closing hashes", () => {
  assert.deepEqual(headings("```\n## Report\n```\n"), []);
  assert.deepEqual(headings("## Report ##\n"), ["Report"]);
});

// --- rules -----------------------------------------------------------------
const RULE = (extra = "") =>
  `### FE-001 Title\nSource: https://example.com/doc\nEval: case-a\nStatus: draft\n${extra}`;

test("rule headings the parser does not recognise are flagged", () => {
  assert.ok(findUnparsedRuleHeadings(RULE() + "#### FE-008 Unsourced\n").some((i) => i.code === "UNPARSED_RULE"));
  assert.ok(findUnparsedRuleHeadings(RULE() + "### Fe-008 lower\n").some((i) => i.code === "UNPARSED_RULE"));
  assert.deepEqual(findUnparsedRuleHeadings(RULE()), []);
});

test("fields under a later ## heading do not leak into the last rule", () => {
  const rules = parseRules(RULE("\n## Notes\nEval: other-case\n"));
  assert.deepEqual(rules[0].eval, ["case-a"]);
});

test("repeated Eval lines accumulate", () => {
  const rules = parseRules("### FE-001 T\nSource: https://a.b\nEval: a\nEval: b\nStatus: draft\n");
  assert.deepEqual(rules[0].eval, ["a", "b"]);
});

test("invalid or missing Status returns BAD_STATUS", () => {
  const bad = parseRules("### FE-001 T\nSource: https://a.b\nEval: a\nStatus: aproved\n");
  assert.ok(checkTraceability(bad, ["a"]).some((i) => i.code === "BAD_STATUS"));
  const missing = parseRules("### FE-001 T\nSource: https://a.b\nEval: a\n");
  assert.ok(checkTraceability(missing, ["a"]).some((i) => i.code === "BAD_STATUS"));
});

test("FE rules need an http(s) Source, BH rules may cite a repo file", () => {
  const todo = parseRules("### FE-001 T\nSource: TODO\nEval: a\nStatus: draft\n");
  assert.ok(checkTraceability(todo, ["a"]).some((i) => i.code === "BAD_SOURCE"));
  const bh = parseRules("### BH-001 T\nSource: core/principles.md\nEval: a\nStatus: draft\n");
  assert.deepEqual(checkTraceability(bh, ["a"]), []);
});

test("two-way traceability between rules and cases", () => {
  const rules = parseRules(
    "### FE-001 A\nSource: https://a.b\nEval: c1\nStatus: draft\n### FE-002 B\nSource: https://a.b\nEval: c1\nStatus: draft\n",
  );
  // case lists a rule that does not exist
  assert.ok(checkCases(rules, [{ id: "c1", rules: ["FE-001", "FE-002", "FE-099"] }]).some((i) => i.code === "UNKNOWN_RULE"));
  // rule points to the case, but the case does not list the rule
  assert.ok(checkCases(rules, [{ id: "c1", rules: ["FE-001"] }]).some((i) => i.code === "TRACE_MISMATCH"));
  // case that no rule references
  assert.ok(checkCases(rules, [{ id: "c1", rules: ["FE-001", "FE-002"] }, { id: "lonely", rules: ["FE-001"] }]).some((i) => i.code === "ORPHAN_CASE"));
  assert.deepEqual(checkCases(rules, [{ id: "c1", rules: ["FE-001", "FE-002"] }]), []);
});

// --- secrets ---------------------------------------------------------------
test("secret scan catches env-style names, unquoted values and more key formats", () => {
  const samples = [
    fake('CLIENT_SEC§RET="abcd1234efgh5678"'),
    fake('DB_PASS§WORD = "Zx9Qw8Er7Ty6"'),
    fake("API_§KEY=abcd1234efgh5678"),
    fake('tok§en: "abcd1234efgh5678"'),
    fake("xox§b-1234567890-abcdefghij"),
    fake("github_§pat_" + "A".repeat(30)),
    fake("AI§za" + "A".repeat(35)),
    fake("ey§Jhbgcioijiuzi1nij9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk1234"),
  ];
  for (const s of samples) assert.ok(scanSecrets(s).length > 0, `expected a SECRET for: ${s.slice(0, 18)}…`);
});

test("secret scan ignores placeholders, types and slugs", () => {
  const clean = [
    'password: "********"',
    'apiKey: "<your-key-here>"',
    "apiKey: process.env.API_KEY",
    "token: Promise<string>",
    "see sk-learn-pipeline-documentation-page for details",
  ];
  for (const s of clean) assert.deepEqual(scanSecrets(s), [], `unexpected SECRET for: ${s}`);
});

// --- validate.ts end to end ------------------------------------------------
const validateScript = fileURLToPath(new URL("../tools/validate.ts", import.meta.url));
function runValidate(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "validate-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, content);
  }
  const r = spawnSync(process.execPath, [validateScript], { env: { ...process.env, VALIDATE_ROOT: root }, encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

test("validate.ts scans .env files, .js files and tests-fixtures folders for secrets", () => {
  const key = fake("AKI§A") + "ABCDEFGHIJKLMNOP";
  for (const path of [".env.local", "tools/x.js", "tests-fixtures/a.md"]) {
    const r = runValidate({ [path]: `K=${key}\n` });
    assert.equal(r.code, 1, `${path} should fail`);
    assert.match(r.out, /SECRET/);
  }
});

test("validate.ts reports a case that lists an unknown rule and a lowercase skill.md", () => {
  const skill = validSkill;
  const rules = "### FE-001 A\nSource: https://a.b\nEval: c1\nStatus: draft\n";
  const kase = "---\nid: c1\ntype: success\nrules: FE-001, FE-099\n---\n## Input\nx\n## Expected\nx\n## Fail If\nx\n";
  const r = runValidate({
    "skills/s/SKILL.md": skill,
    "skills/s/references/rules.md": rules,
    "evaluation/cases/c1.md": kase,
    "skills/t/skill.md": "no frontmatter",
  });
  assert.equal(r.code, 1);
  assert.match(r.out, /UNKNOWN_RULE/);
  assert.match(r.out, /NO_FRONTMATTER/);
});

test("validate.ts reports a case whose id differs from its file name", () => {
  const kase = "---\nid: other\ntype: success\nrules: FE-001\n---\n## Input\nx\n## Expected\nx\n## Fail If\nx\n";
  const r = runValidate({ "evaluation/cases/c1.md": kase });
  assert.match(r.out, /FILENAME_ID/);
});

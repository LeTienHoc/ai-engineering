import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAgent, validateAgentKit } from "../tools/lib/agent.ts";

const SECTIONS = ["Role", "Scope", "Ask When Missing", "Approval Required", "Output Format"];

function agent(
  opts: { fm?: string[]; sections?: string[]; extraLines?: number; eol?: string; bom?: boolean; frontmatter?: boolean } = {},
): string {
  const fm = opts.fm ?? [
    "name: demo",
    'description: "Reviews code for speed. Read only."',
    "tools: Read, Grep, Glob",
    "model: haiku",
  ];
  const sections = opts.sections ?? SECTIONS;
  const body = sections.map((s) => `## ${s}\ntext`).join("\n");
  const pad = Array.from({ length: opts.extraLines ?? 0 }, () => "x").join("\n");
  const head = opts.frontmatter === false ? "" : `---\n${fm.join("\n")}\n---\n`;
  const text = head + body + (pad ? "\n" + pad : "") + "\n";
  const eol = opts.eol ?? "\n";
  return (opts.bom ? "﻿" : "") + text.replace(/\n/g, eol);
}

const bodyLines = (n: number) => n - SECTIONS.length * 2; // valid body is 2 lines per section
const codes = (text: string, file = "demo") => validateAgent(text, file).map((i) => i.code);
const withFm = (replace: (l: string) => string | null) =>
  agent({
    fm: ["name: demo", 'description: "Short."', "tools: Read, Grep, Glob", "model: haiku"]
      .map(replace)
      .filter((l): l is string => l !== null),
  });

test("valid agent returns no issues", () => {
  assert.deepEqual(validateAgent(agent(), "demo"), []);
});

test("missing frontmatter returns NO_FRONTMATTER", () => {
  assert.deepEqual(codes(agent({ frontmatter: false })), ["NO_FRONTMATTER"]);
});

test("missing name and description return MISSING_FIELD naming the field", () => {
  for (const key of ["name", "description"]) {
    const issues = validateAgent(withFm((l) => (l.startsWith(`${key}:`) ? null : l)), "demo");
    assert.ok(issues.some((i) => i.code === "MISSING_FIELD" && i.message.includes(key)), key);
  }
});

test("name that differs from the file name returns NAME_MISMATCH", () => {
  assert.ok(codes(withFm((l) => (l === "name: demo" ? "name: other" : l))).includes("NAME_MISMATCH"));
});

test("description over 300 characters returns DESCRIPTION_TOO_LONG, exactly 300 is fine", () => {
  const make = (n: number) => withFm((l) => (l.startsWith("description:") ? `description: "${"a".repeat(n)}"` : l));
  assert.ok(codes(make(301)).includes("DESCRIPTION_TOO_LONG"));
  assert.ok(!codes(make(300)).includes("DESCRIPTION_TOO_LONG"));
});

test("body over 120 lines returns BODY_TOO_LONG, exactly 120 is fine", () => {
  assert.ok(!codes(agent({ extraLines: bodyLines(120) })).includes("BODY_TOO_LONG"));
  assert.ok(codes(agent({ extraLines: bodyLines(121) })).includes("BODY_TOO_LONG"));
});

test("absent or empty tools returns MISSING_TOOLS explaining inheritance", () => {
  for (const replace of [(l: string) => (l.startsWith("tools:") ? null : l), (l: string) => (l.startsWith("tools:") ? "tools:" : l)]) {
    const issues = validateAgent(withFm(replace), "demo");
    const issue = issues.find((i) => i.code === "MISSING_TOOLS");
    assert.ok(issue, "expected MISSING_TOOLS");
    assert.match(issue.message, /inherit/i);
  }
});

test("model: absent is MISSING_MODEL, unknown is BAD_MODEL, known values are accepted", () => {
  assert.ok(codes(withFm((l) => (l.startsWith("model:") ? null : l))).includes("MISSING_MODEL"));
  assert.ok(codes(withFm((l) => (l.startsWith("model:") ? "model: gpt4" : l))).includes("BAD_MODEL"));
  for (const m of ["haiku", "sonnet", "opus", "inherit", "claude-sonnet-5-5"]) {
    assert.deepEqual(validateAgent(withFm((l) => (l.startsWith("model:") ? `model: ${m}` : l)), "demo"), [], m);
  }
});

test("each missing section returns MISSING_SECTION naming it", () => {
  for (const s of SECTIONS) {
    const issues = validateAgent(agent({ sections: SECTIONS.filter((x) => x !== s) }), "demo");
    assert.ok(issues.some((i) => i.code === "MISSING_SECTION" && i.message.includes(s)), s);
  }
});

test("CRLF and BOM give the same result as LF", () => {
  assert.deepEqual(validateAgent(agent({ eol: "\r\n", bom: true }), "demo"), []);
  assert.ok(codes(agent({ eol: "\r\n", bom: true, extraLines: bodyLines(121) })).includes("BODY_TOO_LONG"));
});

test("unquoted description containing ': ' returns UNSUPPORTED_YAML", () => {
  assert.ok(codes(withFm((l) => (l.startsWith("description:") ? "description: use when: x" : l))).includes("UNSUPPORTED_YAML"));
});

const kitCase = (id: string, type: string) => ({ id, type });
const three = [kitCase("a", "success"), kitCase("b", "failure"), kitCase("c", "edge")];

test("kit without rules returns NO_KIT_RULES", () => {
  assert.ok(validateAgentKit({ name: "demo", hasRules: false, cases: three }).some((i) => i.code === "NO_KIT_RULES"));
});

test("kit with fewer than 3 cases returns TOO_FEW_CASES", () => {
  assert.ok(validateAgentKit({ name: "demo", hasRules: true, cases: three.slice(0, 2) }).some((i) => i.code === "TOO_FEW_CASES"));
});

test("kit missing a case type returns MISSING_CASE_TYPE naming it", () => {
  for (const t of ["success", "failure", "edge"]) {
    const cases = [...three.filter((c) => c.type !== t), kitCase("d", "security"), kitCase("e", "security")];
    const issues = validateAgentKit({ name: "demo", hasRules: true, cases });
    assert.ok(issues.some((i) => i.code === "MISSING_CASE_TYPE" && i.message.includes(t)), t);
  }
});

test("complete kit returns no issues", () => {
  assert.deepEqual(validateAgentKit({ name: "demo", hasRules: true, cases: three }), []);
});

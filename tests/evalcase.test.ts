import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEvalCase } from "../tools/lib/evalcase.ts";

function evalCase(opts: { type?: string; sections?: string[] } = {}): string {
  const sections = opts.sections ?? ["Input", "Expected", "Fail If"];
  return (
    `---\nid: demo-case\ntype: ${opts.type ?? "success"}\nrules: FE-001, FE-002\n---\n` +
    sections.map((s) => `## ${s}\ntext\n`).join("\n")
  );
}

test("valid eval case returns no issues", () => {
  assert.deepEqual(validateEvalCase(evalCase()), []);
});

test("bad type returns BAD_TYPE", () => {
  const issues = validateEvalCase(evalCase({ type: "weird" }));
  assert.ok(issues.some((i) => i.code === "BAD_TYPE"));
});

test("missing Fail If returns MISSING_SECTION", () => {
  const issues = validateEvalCase(evalCase({ sections: ["Input", "Expected"] }));
  assert.ok(issues.some((i) => i.code === "MISSING_SECTION" && i.message.includes("Fail If")));
});

test("missing frontmatter returns NO_FRONTMATTER", () => {
  assert.equal(validateEvalCase("## Input\nx")[0].code, "NO_FRONTMATTER");
});

test("CRLF valid case returns no issues", () => {
  assert.deepEqual(validateEvalCase(evalCase().replace(/\n/g, "\r\n")), []);
});

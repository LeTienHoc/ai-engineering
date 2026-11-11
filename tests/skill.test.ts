import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSkill } from "../tools/lib/skill.ts";

const SECTIONS = [
  "Role",
  "Objective",
  "Inputs",
  "Outputs",
  "Constraints",
  "Workflow",
  "Ask When Missing",
  "Approval Required",
  "Verify",
  "Report",
];

function skill(opts: { sections?: string[]; description?: boolean; frontmatter?: boolean } = {}): string {
  const sections = opts.sections ?? SECTIONS;
  const fm =
    opts.frontmatter === false
      ? ""
      : `---\nname: demo\n${opts.description === false ? "" : "description: A demo skill\n"}---\n`;
  return fm + sections.map((s) => `## ${s}\ntext\n`).join("\n");
}

test("valid skill returns no issues", () => {
  assert.deepEqual(validateSkill(skill()), []);
});

test("missing frontmatter returns NO_FRONTMATTER without throwing", () => {
  const issues = validateSkill(skill({ frontmatter: false }));
  assert.equal(issues[0].code, "NO_FRONTMATTER");
});

test("missing description returns MISSING_FIELD", () => {
  const issues = validateSkill(skill({ description: false }));
  assert.ok(issues.some((i) => i.code === "MISSING_FIELD" && i.message.includes("description")));
});

test("each missing section returns MISSING_SECTION naming it", () => {
  for (const s of SECTIONS) {
    const issues = validateSkill(skill({ sections: SECTIONS.filter((x) => x !== s) }));
    assert.ok(
      issues.some((i) => i.code === "MISSING_SECTION" && i.message.includes(s)),
      `expected MISSING_SECTION for ${s}`,
    );
  }
});

test("CRLF version of a valid skill returns no issues", () => {
  assert.deepEqual(validateSkill(skill().replace(/\n/g, "\r\n")), []);
});

import { headings, parseFrontmatter, type Issue } from "./frontmatter.ts";

export type { Issue };

export const SKILL_SECTIONS = [
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

export function validateSkill(text: string): Issue[] {
  const fm = parseFrontmatter(text);
  if (!fm) return [{ code: "NO_FRONTMATTER", message: "SKILL.md must start with a --- frontmatter block" }];
  const issues: Issue[] = [];
  for (const key of ["name", "description"]) {
    if (!fm.data[key]) issues.push({ code: "MISSING_FIELD", message: `frontmatter is missing '${key}'` });
  }
  const present = new Set(headings(fm.body));
  for (const section of SKILL_SECTIONS) {
    if (!present.has(section)) issues.push({ code: "MISSING_SECTION", message: `missing section '## ${section}'` });
  }
  return issues;
}

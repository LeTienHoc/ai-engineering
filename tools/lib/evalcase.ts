import { headings, parseFrontmatter, type Issue } from "./frontmatter.ts";

export const EVAL_TYPES = ["success", "failure", "edge", "security", "consistency"];
export const EVAL_SECTIONS = ["Input", "Expected", "Fail If"];

export function validateEvalCase(text: string): Issue[] {
  const fm = parseFrontmatter(text);
  if (!fm) return [{ code: "NO_FRONTMATTER", message: "eval case must start with a --- frontmatter block" }];
  const issues: Issue[] = [];
  for (const key of ["id", "type", "rules"]) {
    if (!fm.data[key] || (Array.isArray(fm.data[key]) && fm.data[key].length === 0)) {
      issues.push({ code: "MISSING_FIELD", message: `frontmatter is missing '${key}'` });
    }
  }
  const type = fm.data.type;
  if (type && !EVAL_TYPES.includes(String(type))) {
    issues.push({ code: "BAD_TYPE", message: `type '${type}' must be one of ${EVAL_TYPES.join("|")}` });
  }
  const present = new Set(headings(fm.body));
  for (const section of EVAL_SECTIONS) {
    if (!present.has(section)) issues.push({ code: "MISSING_SECTION", message: `missing section '## ${section}'` });
  }
  return issues;
}

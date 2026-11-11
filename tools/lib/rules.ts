import type { Issue } from "./frontmatter.ts";

export type Rule = { id: string; source: string | null; eval: string[]; status: string };

export function parseRules(text: string): Rule[] {
  const rules: Rule[] = [];
  let current: Rule | null = null;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const heading = /^###\s+([A-Z]+-\d+)\b/.exec(line);
    if (heading) {
      current = { id: heading[1], source: null, eval: [], status: "draft" };
      rules.push(current);
      continue;
    }
    if (!current) continue;
    const field = /^(Source|Eval|Status):\s*(.*)$/.exec(line);
    if (!field) continue;
    const value = field[2].trim();
    if (field[1] === "Source") current.source = value || null;
    else if (field[1] === "Status") current.status = value;
    else current.eval = value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return rules;
}

export function checkTraceability(rules: Rule[], caseIds: string[]): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  const known = new Set(caseIds);
  for (const rule of rules) {
    if (seen.has(rule.id)) issues.push({ code: "DUPLICATE_ID", message: `rule id ${rule.id} is used more than once` });
    seen.add(rule.id);
    if (!rule.source) issues.push({ code: "NO_SOURCE", message: `${rule.id} has no Source` });
    if (rule.eval.length === 0) issues.push({ code: "NO_EVAL", message: `${rule.id} has no Eval case` });
    for (const id of rule.eval) {
      if (!known.has(id)) issues.push({ code: "UNKNOWN_EVAL", message: `${rule.id} references unknown eval case '${id}'` });
    }
  }
  return issues;
}

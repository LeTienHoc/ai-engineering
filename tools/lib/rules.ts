import type { Issue } from "./frontmatter.ts";

export type Rule = { id: string; source: string | null; eval: string[]; status: string };
export type CaseRef = { id: string; rules: string[] };

const RULE_HEADING = /^###\s+([A-Z]+-\d+)\b/;
const STATUSES = ["draft", "approved"];

export function parseRules(text: string): Rule[] {
  const rules: Rule[] = [];
  let current: Rule | null = null;
  for (const line of text.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n")) {
    const heading = RULE_HEADING.exec(line);
    if (heading) {
      current = { id: heading[1], source: null, eval: [], status: "" };
      rules.push(current);
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      current = null; // any other heading ends the current rule
      continue;
    }
    if (!current) continue;
    const field = /^(Source|Eval|Status):\s*(.*)$/.exec(line);
    if (!field) continue;
    const value = field[2].trim();
    if (field[1] === "Source") current.source = value || null;
    else if (field[1] === "Status") current.status = value;
    else current.eval.push(...value.split(",").map((v) => v.trim()).filter(Boolean));
  }
  return rules;
}

/** Headings that look like a rule id but would be silently skipped by parseRules. */
export function findUnparsedRuleHeadings(text: string): Issue[] {
  const issues: Issue[] = [];
  for (const line of text.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n")) {
    if (/^#{1,6}\s/.test(line) && /\b[A-Za-z]{2,}-\d+\b/.test(line) && !RULE_HEADING.test(line)) {
      issues.push({ code: "UNPARSED_RULE", message: `heading looks like a rule but is not '### XX-000 Title': ${line.trim()}` });
    }
  }
  return issues;
}

export function checkTraceability(rules: Rule[], caseIds: string[]): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  const known = new Set(caseIds);
  for (const rule of rules) {
    if (seen.has(rule.id)) issues.push({ code: "DUPLICATE_ID", message: `rule id ${rule.id} is used more than once` });
    seen.add(rule.id);
    if (!rule.source) issues.push({ code: "NO_SOURCE", message: `${rule.id} has no Source` });
    else if (rule.id.startsWith("FE-") && !/^https?:\/\/\S+$/.test(rule.source)) {
      issues.push({ code: "BAD_SOURCE", message: `${rule.id} Source must be an http(s) URL, got '${rule.source}'` });
    }
    if (!STATUSES.includes(rule.status)) {
      issues.push({ code: "BAD_STATUS", message: `${rule.id} Status must be one of ${STATUSES.join("|")}, got '${rule.status}'` });
    }
    if (rule.eval.length === 0) issues.push({ code: "NO_EVAL", message: `${rule.id} has no Eval case` });
    for (const id of rule.eval) {
      if (!known.has(id)) issues.push({ code: "UNKNOWN_EVAL", message: `${rule.id} references unknown eval case '${id}'` });
    }
  }
  return issues;
}

/** The case -> rule direction of traceability. */
export function checkCases(rules: Rule[], cases: CaseRef[]): Issue[] {
  const issues: Issue[] = [];
  const byId = new Map(rules.map((r) => [r.id, r]));
  for (const c of cases) {
    const referenced = rules.some((r) => r.eval.includes(c.id));
    if (!referenced) issues.push({ code: "ORPHAN_CASE", message: `eval case '${c.id}' is not referenced by any rule` });
    for (const ruleId of c.rules) {
      const rule = byId.get(ruleId);
      if (!rule) issues.push({ code: "UNKNOWN_RULE", message: `case '${c.id}' lists unknown rule ${ruleId}` });
      else if (!rule.eval.includes(c.id)) {
        issues.push({ code: "TRACE_MISMATCH", message: `case '${c.id}' lists ${ruleId}, but ${ruleId} does not list the case in Eval` });
      }
    }
  }
  const caseById = new Map(cases.map((c) => [c.id, c]));
  for (const rule of rules) {
    for (const id of rule.eval) {
      const c = caseById.get(id);
      if (c && !c.rules.includes(rule.id)) {
        issues.push({ code: "TRACE_MISMATCH", message: `${rule.id} lists case '${id}', but the case does not list ${rule.id} in rules` });
      }
    }
  }
  return issues;
}

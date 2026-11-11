import type { Issue } from "./frontmatter.ts";

export type KnownTerm = { term: string; meaning: string; status: "proposed" | "confirmed" };

/** Aggregation key used everywhere a term is compared or counted. */
export function normalizeTerm(t: string): string {
  return t
    .normalize("NFKC")
    .replace(/[​-‍﻿]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Reads lines of the form `- <term> | <meaning> | <proposed|confirmed>`. */
export function parseKnownTerms(text: string): { terms: KnownTerm[]; issues: Issue[] } {
  const terms: KnownTerm[] = [];
  const issues: Issue[] = [];
  const seen = new Set<string>();
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    if (!/^\s*[-*]\s/.test(raw)) continue;
    const parts = raw.replace(/^\s*[-*]\s+/, "").split("|").map((p) => p.trim());
    if (parts.length !== 3 || parts.some((p) => p === "")) {
      issues.push({ code: "BAD_LINE", message: `expected '- term | meaning | proposed|confirmed', got: ${raw.trim()}` });
      continue;
    }
    const [term, meaning, status] = parts;
    if (status !== "proposed" && status !== "confirmed") {
      issues.push({ code: "BAD_STATUS", message: `status of '${term}' must be proposed or confirmed, got '${status}'` });
      continue;
    }
    const key = normalizeTerm(term);
    if (seen.has(key)) {
      issues.push({ code: "DUPLICATE_TERM", message: `term '${term}' is listed more than once` });
      continue;
    }
    seen.add(key);
    terms.push({ term, meaning, status });
  }
  return { terms, issues };
}

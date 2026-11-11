import type { Issue } from "./frontmatter.ts";
import { scanSecrets } from "./secrets.ts";

export type Entry = {
  date: string;
  term: string;
  agent: string;
  topic: string;
  context: string;
  meaning: string;
};

const STRING_FIELDS = ["date", "term", "agent", "topic", "context", "meaning"] as const;
const REQUIRED = new Set(["date", "term", "agent", "meaning"]);
const MAX = { term: 80, context: 300, meaning: 400 } as const;

// A drive letter path, a backslash path, or an absolute Unix-style path with at least two segments.
const PATH_PATTERNS = [/(?<![A-Za-z0-9])[A-Za-z]:[\\/]/, /[A-Za-z0-9_.-]+\\[A-Za-z0-9_.-]+/, /(?:^|\s)\/[\w.-]+\/[\w./-]+/];

export function validateEntry(e: Entry): Issue[] {
  const issues: Issue[] = [];
  const bad = (message: string) => issues.push({ code: "BAD_FIELD", message });
  for (const key of STRING_FIELDS) {
    const value = (e as Record<string, unknown>)[key];
    if (typeof value !== "string") bad(`'${key}' must be a string`);
    else if (REQUIRED.has(key) && value.trim() === "") bad(`'${key}' must not be empty`);
  }
  if (issues.length > 0) return issues;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) bad(`'date' must be YYYY-MM-DD, got '${e.date}'`);
  for (const [key, max] of Object.entries(MAX)) {
    const value = (e as Record<string, string>)[key];
    if (value.length > max) issues.push({ code: "TOO_LONG", message: `'${key}' is ${value.length} characters, the limit is ${max}` });
  }
  for (const key of ["term", "topic", "context", "meaning"] as const) {
    const value = e[key];
    if (PATH_PATTERNS.some((re) => re.test(value)) || scanSecrets(value).length > 0) {
      issues.push({ code: "PRIVATE_DATA", message: `'${key}' looks like it contains a path or a secret` });
    }
  }
  return issues;
}

/** Exactly one line of JSON; embedded newlines are escaped by JSON.stringify. */
export function formatEntry(e: Entry): string {
  const { date, term, agent, topic, context, meaning } = e;
  return JSON.stringify({ date, term, agent, topic, context, meaning });
}

export function parseLedger(text: string): { entries: Entry[]; errors: { line: number; message: string }[] } {
  const entries: Entry[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = i + 1;
    if (raw.trim() === "") return;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      errors.push({ line, message: "not valid JSON (truncated or hand-edited?)" });
      return;
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push({ line, message: "not a JSON object" });
      return;
    }
    const entry = value as Entry;
    const issues = validateEntry(entry);
    if (issues.length > 0) {
      errors.push({ line, message: issues.map((x) => `${x.code}: ${x.message}`).join("; ") });
      return;
    }
    entries.push(entry);
  });
  return { entries, errors };
}

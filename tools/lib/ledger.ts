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
const MAX = { term: 80, agent: 80, topic: 80, context: 300, meaning: 400 } as const;
const FREE_TEXT = ["term", "agent", "topic", "context", "meaning"] as const;

const LEAD = String.raw`(?:^|[\s"'(\[])`;
// Anything that looks like a path, a home or relative reference, an environment reference,
// a non-http(s) URL or a URL carrying credentials. Public https URLs are allowed.
const PRIVATE_PATTERNS: RegExp[] = [
  /(?<![A-Za-z0-9])[A-Za-z]:[\\/]/, // drive letter path
  /[A-Za-z0-9_.-]{2,60}\\[A-Za-z0-9_.-]{2,60}/, // backslash path (bounded: no quadratic scan)
  /\\\\[^\s\\]+\\/, // UNC path
  new RegExp(`${LEAD}/[\\w.-]+/[\\w./-]+`), // absolute Unix-style path
  new RegExp(`${LEAD}~[\\\\/]`), // ~/...
  new RegExp(`${LEAD}\\.{1,2}[\\\\/]`), // ./ or ../
  /\$[A-Za-z_]\w*[\\/]/, // $HOME/x
  /%[A-Za-z_]\w*%/, // %USERPROFILE%
  /(?<![\w.:/-])[\w-]+\/[\w.-]+\.(?:tsx?|jsx?|mjs|cjs|json|md|py|java|cs|go|rb|php|env|ya?ml|toml|sql|sh)\b/i, // dir/file.ext
  /\b(?!https?:)[a-z][a-z0-9+.-]*:\/\/\S/i, // non-http(s) scheme
  /\w+:\/\/[^\s/@]+@/, // credentials inside a URL
];

export function validateEntry(e: Entry): Issue[] {
  const issues: Issue[] = [];
  const bad = (message: string) => issues.push({ code: "BAD_FIELD", message });
  for (const key of STRING_FIELDS) {
    const value = (e as Record<string, unknown>)[key];
    if (typeof value !== "string") bad(`'${key}' must be a string`);
    else if (REQUIRED.has(key) && value.trim() === "") bad(`'${key}' must not be empty`);
  }
  if (issues.length > 0) return issues;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || Number.isNaN(Date.parse(e.date)) || new Date(e.date).toISOString().slice(0, 10) !== e.date) {
    bad(`'date' must be a real YYYY-MM-DD date, got '${e.date}'`);
  }
  // Length first: an over-long field is rejected without running any pattern over it.
  for (const [key, max] of Object.entries(MAX)) {
    const value = (e as Record<string, string>)[key];
    if (value.length > max) issues.push({ code: "TOO_LONG", message: `'${key}' is ${value.length} characters, the limit is ${max}` });
  }
  if (issues.some((i) => i.code === "TOO_LONG")) return issues;
  for (const key of FREE_TEXT) {
    const value = e[key];
    if (PRIVATE_PATTERNS.some((re) => re.test(value)) || scanSecrets(value).length > 0) {
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

export type LedgerError = { line: number; message: string; codes: string[] };

export function parseLedger(text: string): { entries: Entry[]; errors: LedgerError[] } {
  const entries: Entry[] = [];
  const errors: LedgerError[] = [];
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = i + 1;
    if (raw.trim() === "") return;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      errors.push({ line, message: "not valid JSON (truncated or hand-edited?)", codes: ["BAD_JSON"] });
      return;
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push({ line, message: "not a JSON object", codes: ["BAD_JSON"] });
      return;
    }
    const entry = value as Entry;
    const issues = validateEntry(entry);
    if (issues.length > 0) {
      errors.push({ line, message: issues.map((x) => `${x.code}: ${x.message}`).join("; "), codes: issues.map((x) => x.code) });
      return;
    }
    entries.push(entry);
  });
  return { entries, errors };
}

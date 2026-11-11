export type Issue = { code: string; message: string };

export type Frontmatter = {
  data: Record<string, string | string[]>;
  body: string;
  /** Keys written in YAML forms this minimal parser cannot read faithfully. */
  unsupported: string[];
};

const stripQuotes = (v: string) => (v.length >= 2 && /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v);

/**
 * Parse the supported frontmatter subset: single-line `key: value`, optionally quoted,
 * with `[a, b]` or comma lists for list values. Block scalars, multi-line values and
 * unquoted values containing ": " are reported in `unsupported`.
 */
export function parseFrontmatter(text: string): Frontmatter | null {
  const normalized = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) return null;
  const data: Record<string, string | string[]> = {};
  const unsupported: string[] = [];
  let last: string | null = null;
  for (const line of match[1].split("\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) {
      if (last && /^(\s+|-\s)/.test(line) && !unsupported.includes(last)) unsupported.push(last);
      continue;
    }
    const key = kv[1];
    const raw = kv[2].trim();
    last = key;
    if (/^[>|][+-]?$/.test(raw)) {
      unsupported.push(key);
      data[key] = raw;
      continue;
    }
    const quoted = /^(["']).*\1$/.test(raw);
    if (!quoted && raw.includes(": ")) unsupported.push(key);
    const value = stripQuotes(raw);
    if (!quoted && /^\[.*\]$/.test(value)) {
      data[key] = value.slice(1, -1).split(",").map((v) => stripQuotes(v.trim())).filter(Boolean);
    } else if (!quoted && key === "rules" && value.includes(",")) {
      data[key] = value.split(",").map((v) => v.trim()).filter(Boolean);
    } else {
      data[key] = value;
    }
  }
  return { data, body: match[2], unsupported };
}

export function unsupportedIssues(fm: Frontmatter): Issue[] {
  return fm.unsupported.map((key) => ({
    code: "UNSUPPORTED_YAML",
    message: `frontmatter key '${key}' uses a YAML form this tool cannot verify (block scalar, multi-line, or unquoted ': '); use a single-line value, quoted if it contains ': '`,
  }));
}

/** Level-2 heading titles in a markdown body, ignoring fenced code blocks. */
export function headings(body: string): string[] {
  const withoutFences = body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "");
  return [...withoutFences.matchAll(/^##\s+(.+?)(?:\s+#+)?\s*$/gm)].map((m) => m[1].trim());
}

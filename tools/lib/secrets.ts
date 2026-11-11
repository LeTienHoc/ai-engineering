import type { Issue } from "./frontmatter.ts";

const PATTERNS: [string, RegExp][] = [
  ["sk- style API key", /\bsk-[A-Za-z0-9_-]{20,}/],
  ["AWS access key id", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\bghp_[A-Za-z0-9]{36}\b/],
  ["private key header", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["literal credential assignment", /\b(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*["'][^"'\s]{8,}["']/i],
];

export function scanSecrets(text: string): Issue[] {
  const issues: Issue[] = [];
  for (const [name, re] of PATTERNS) {
    if (re.test(text)) issues.push({ code: "SECRET", message: `possible secret: ${name}` });
  }
  return issues;
}

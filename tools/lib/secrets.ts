import type { Issue } from "./frontmatter.ts";

const START = "(?<![A-Za-z0-9])";

const KEY_PATTERNS: [string, RegExp][] = [
  ["sk- style API key", new RegExp(`${START}sk-(?=[A-Za-z0-9_-]*\\d)[A-Za-z0-9_-]{20,}`)],
  ["AWS access key id", new RegExp(`${START}AKIA[0-9A-Z]{16}(?![A-Za-z0-9])`)],
  ["GitHub token", new RegExp(`${START}ghp_[A-Za-z0-9]{36}(?![A-Za-z0-9])`)],
  ["GitHub fine-grained token", new RegExp(`${START}github_pat_[A-Za-z0-9_]{22,}`)],
  ["Slack token", new RegExp(`${START}xox[abpr]-[A-Za-z0-9-]{10,}`)],
  ["Google API key", new RegExp(`${START}AIza[0-9A-Za-z_-]{35}`)],
  ["JSON web token", new RegExp(`${START}eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}`)],
  ["private key header", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

// name that contains a credential word, then : or =, then a literal value
const ASSIGNMENT = new RegExp(
  `${START}[A-Za-z0-9_]*(?:password|passwd|secret|api[_-]?key|token)[A-Za-z0-9_]*["']?\\s*[:=]\\s*(["']?)([^"'\\s,;]{8,})\\1`,
  "gi",
);

function looksLikeLiteral(value: string, quoted: boolean): boolean {
  if (/^[*xX.\-_#]+$/.test(value)) return false; // masked placeholder
  if (/[<>(){}$]/.test(value)) return false; // template, type or expression
  if (/^(process|env|import)\b/.test(value)) return false;
  if (quoted) return true;
  return /\d/.test(value) && /[A-Za-z]/.test(value); // unquoted: require a letter+digit mix
}

export function scanSecrets(text: string): Issue[] {
  const issues: Issue[] = [];
  for (const [name, re] of KEY_PATTERNS) {
    if (re.test(text)) issues.push({ code: "SECRET", message: `possible secret: ${name}` });
  }
  for (const m of text.matchAll(ASSIGNMENT)) {
    if (looksLikeLiteral(m[2], m[1] !== "")) {
      issues.push({ code: "SECRET", message: "possible secret: literal credential assignment" });
      break;
    }
  }
  return issues;
}

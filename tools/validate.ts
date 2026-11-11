import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, type Issue } from "./lib/frontmatter.ts";
import { validateSkill } from "./lib/skill.ts";
import { caseRules, validateEvalCase } from "./lib/evalcase.ts";
import { checkCases, checkTraceability, findUnparsedRuleHeadings, parseRules, type CaseRef, type Rule } from "./lib/rules.ts";
import { scanSecrets } from "./lib/secrets.ts";
import { parseKnownTerms } from "./lib/knownterms.ts";

const root = resolve(process.env.VALIDATE_ROOT ?? resolve(fileURLToPath(import.meta.url), "..", ".."));
const SKIP_DIRS = new Set([".git", "node_modules", ".superpowers"]);
const BINARY = /\.(png|jpe?g|gif|ico|webp|pdf|zip|gz|woff2?|ttf|eot|mp4|mov)$/i;
const MAX_SCAN_BYTES = 2 * 1024 * 1024;
const found: { file: string; issue: Issue }[] = [];

function report(file: string, issues: Issue[]) {
  for (const issue of issues) found.push({ file: relative(root, file), issue });
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const read = (f: string) => readFileSync(f, "utf8");
const rel = (f: string) => relative(root, f).replace(/\\/g, "/");
const all = walk(root);

// Eval cases (any depth under evaluation/cases)
const cases: CaseRef[] = [];
for (const f of all.filter((f) => /^evaluation\/cases\/.+\.md$/.test(rel(f)))) {
  const text = read(f);
  report(f, validateEvalCase(text));
  const fm = parseFrontmatter(text);
  const id = fm?.data.id;
  if (typeof id === "string" && id) {
    if (cases.some((c) => c.id === id)) report(f, [{ code: "DUPLICATE_ID", message: `eval case id '${id}' is used more than once` }]);
    if (id !== basename(f, ".md")) report(f, [{ code: "FILENAME_ID", message: `case id '${id}' must equal its file name '${basename(f, ".md")}'` }]);
    cases.push({ id, rules: caseRules(fm.data.rules) });
  }
}

// Skills (SKILL.md in any letter case) and their rules
const allRules: Rule[] = [];
let firstRulesFile: string | null = null;
for (const f of all.filter((f) => /^skills\/[^/]+\/skill\.md$/i.test(rel(f)))) report(f, validateSkill(read(f)));
for (const f of all.filter((f) => /^skills\/[^/]+\/references\/rules\.md$/.test(rel(f)))) {
  const text = read(f);
  const rules = parseRules(text);
  firstRulesFile ??= f;
  report(f, [...findUnparsedRuleHeadings(text), ...checkTraceability(rules, cases.map((c) => c.id))]);
  allRules.push(...rules);
}
if (firstRulesFile || cases.length > 0) report(firstRulesFile ?? join(root, "evaluation", "cases"), checkCases(allRules, cases));

// Regression term list
for (const f of all.filter((f) => rel(f) === "evaluation/known-terms.md")) report(f, parseKnownTerms(read(f)).issues);

// Secret scan: every text file, including .env*, scripts and test fixtures
for (const f of all) {
  if (BINARY.test(f) || statSync(f).size > MAX_SCAN_BYTES) continue;
  report(f, scanSecrets(read(f)));
}

if (found.length === 0) {
  console.log("validate: OK");
} else {
  for (const { file, issue } of found) console.error(`${file}: [${issue.code}] ${issue.message}`);
  console.error(`validate: ${found.length} issue(s)`);
  process.exit(1);
}
